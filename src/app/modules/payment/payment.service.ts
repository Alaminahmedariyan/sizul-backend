import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { getStripe } from "../../../lib/stripe";
import config from "../../config";
import { Prisma } from "../../../generated/prisma/client";
import type { Payment, Proposal } from "../../../generated/prisma/client";
import { paymentQueryConfig } from "./payment.constant";
import { createNotification } from "../notification/notification.service";
import type { RequestingUser } from "./payment.interface";

const paymentDelegate = prisma.payment as unknown as PrismaDelegate<Payment>;

const primaryClientUrl = () => config.app.clientUrl.split(",")[0]?.trim() ?? "";

const assertCanPayForProposal = async (proposalId: string, requestedBy: RequestingUser): Promise<Proposal> => {
	const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
	if (!proposal) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided proposalId does not match any proposal.");
	}

	if (proposal.status === "DRAFT") {
		throw new AppError(StatusCodes.BAD_REQUEST, "This proposal hasn't been sent yet, so it can't be paid for.");
	}
	if (proposal.status === "REJECTED" || proposal.status === "EXPIRED") {
		throw new AppError(StatusCodes.BAD_REQUEST, `This proposal is ${proposal.status.toLowerCase()} and can no longer be paid for.`);
	}

	// A client may only pay for their own proposal — Admin/Staff can initiate on
	// behalf of any client (e.g. taking a payment over the phone).
	if (requestedBy.role === "CLIENT") {
		const client = await prisma.client.findUnique({ where: { userId: requestedBy.id } });
		if (!client || proposal.clientId !== client.id) {
			throw new AppError(StatusCodes.FORBIDDEN, "You can only pay for your own proposals.");
		}
	}

	return proposal;
};

const notifyProposalCreatorOfPayment = async (proposalId: string, providerLabel: string) => {
	try {
		const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
		if (proposal) {
			await createNotification({
				userId: proposal.createdById,
				type: "PROPOSAL_ACCEPTED",
				entityType: "PROPOSAL",
				entityId: proposal.id,
				title: "Payment received",
				message: `${providerLabel} payment for proposal ${proposal.proposalNumber} has been received.`,
			});
		}
	} catch (error) {
		console.error("[Payment] Failed to send payment-received notification:", error);
	}
};

// ============================================================
// STRIPE
// ============================================================

const createStripeCheckoutInDB = async (proposalId: string, requestedBy: RequestingUser) => {
	const proposal = await assertCanPayForProposal(proposalId, requestedBy);

	const clientUrl = primaryClientUrl();
	const successUrl = `${clientUrl}/proposals/${proposal.id}?payment=success`;
	const cancelUrl = `${clientUrl}/proposals/${proposal.id}?payment=cancelled`;

	// Stripe expects the amount in the smallest currency unit (cents for USD).
	const unitAmount = Math.round(proposal.total.toNumber() * 100);

	const session = await getStripe().checkout.sessions.create({
		mode: "payment",
		success_url: successUrl,
		cancel_url: cancelUrl,
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: proposal.currency.toLowerCase(),
					unit_amount: unitAmount,
					product_data: { name: `Proposal ${proposal.proposalNumber}`, description: proposal.title },
				},
			},
		],
		metadata: { proposalId: proposal.id },
	});

	const payment = await prisma.payment.create({
		data: {
			proposalId: proposal.id,
			clientId: proposal.clientId,
			provider: "STRIPE",
			providerPaymentId: session.id,
			amount: proposal.total,
			currency: proposal.currency,
			status: "PENDING",
		},
	});

	return { checkoutUrl: session.url, payment };
};

// Called from the Stripe webhook handler only.
const markPaymentSucceededByProviderIdInDB = async (providerPaymentId: string) => {
	const payment = await prisma.payment.findUnique({ where: { providerPaymentId } });
	if (!payment) {
		console.warn(`[Payment] No payment record found for providerPaymentId ${providerPaymentId}`);
		return;
	}
	if (payment.status === "SUCCEEDED") {
		return; // already processed — Stripe can send duplicate webhook deliveries
	}

	const updated = await prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED", paidAt: new Date() } });
	if (updated.proposalId) {
		await notifyProposalCreatorOfPayment(updated.proposalId, "Stripe");
	}
	return updated;
};

const markPaymentFailedByProviderIdInDB = async (providerPaymentId: string, reason?: string) => {
	const payment = await prisma.payment.findUnique({ where: { providerPaymentId } });
	if (!payment) {
		console.warn(`[Payment] No payment record found for providerPaymentId ${providerPaymentId}`);
		return;
	}

	return prisma.payment.update({
		where: { id: payment.id },
		data: { status: "FAILED", ...(reason !== undefined && { metadata: { reason } as Prisma.InputJsonValue }) },
	});
};

// ============================================================
// SHARED READ/MANAGEMENT
// ============================================================

export const getAllPaymentsFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<Payment>(paymentDelegate, paymentQueryConfig);
	return queryBuilder.execute(query);
};

export const getPaymentByIdFromDB = async (id: string) => {
	const payment = await prisma.payment.findUnique({ where: { id }, include: { proposal: true, client: true } });
	if (!payment) {
		throw new AppError(StatusCodes.NOT_FOUND, "Payment not found.");
	}
	return payment;
};

export const getMyPaymentsFromDB = async (userId: string, query: Record<string, unknown>) => {
	const client = await prisma.client.findUnique({ where: { userId } });
	if (!client) {
		throw new AppError(StatusCodes.BAD_REQUEST, "No client profile is linked to your account.");
	}

	const effectiveQuery: Record<string, unknown> = { ...query, clientId: client.id };
	const queryBuilder = new QueryBuilder<Payment>(paymentDelegate, paymentQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

// ============================================================
// REFUND (Stripe only, for now)
// ============================================================

const refundStripePaymentInDB = async (id: string) => {
	const payment = await prisma.payment.findUnique({ where: { id } });
	if (!payment) {
		throw new AppError(StatusCodes.NOT_FOUND, "Payment not found.");
	}
	if (payment.provider !== "STRIPE") {
		throw new AppError(StatusCodes.BAD_REQUEST, "Only Stripe payments can be refunded through this endpoint.");
	}
	if (payment.status !== "SUCCEEDED") {
		throw new AppError(StatusCodes.BAD_REQUEST, "Only a successfully paid payment can be refunded.");
	}
	if (!payment.providerPaymentId) {
		throw new AppError(StatusCodes.BAD_REQUEST, "This payment has no associated Stripe session.");
	}

	// providerPaymentId holds the Checkout Session ID (not the PaymentIntent ID),
	// since that's what we stored at checkout-creation time — retrieve the
	// session to find the actual PaymentIntent to refund.
	const session = await getStripe().checkout.sessions.retrieve(payment.providerPaymentId);
	if (!session.payment_intent) {
		throw new AppError(StatusCodes.BAD_REQUEST, "No payment intent found for this session.");
	}

	const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id;

	await getStripe().refunds.create({ payment_intent: paymentIntentId });

	return prisma.payment.update({ where: { id }, data: { status: "REFUNDED" } });
};

export const paymentService = {
	createStripeCheckoutInDB,
	markPaymentSucceededByProviderIdInDB,
	markPaymentFailedByProviderIdInDB,
	getAllPaymentsFromDB,
	getPaymentByIdFromDB,
	getMyPaymentsFromDB,
	refundStripePaymentInDB,
};