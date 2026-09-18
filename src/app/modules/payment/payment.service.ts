import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { getStripe } from "../../../lib/stripe";
// ADJUST THESE PATHS if your bKash/SSLCommerz lib files use different names —
// same caveat as the Cloudinary upload util in projectFile.service.ts: these
// filenames are my best guess based on your earlier pasted code's own relative
// imports, not something I could verify directly.
import { sslcommerz } from "../../../lib/sslcommerz";
import { getBkashIdToken } from "../../../lib/bkash";
import config from "../../config";
import { Prisma } from "../../../generated/prisma/client";
import type { Payment, Proposal } from "../../../generated/prisma/client";
import { paymentQueryConfig } from "./payment.constant";
import { createNotification } from "../notification/notification.service";
import type { RequestingUser, BkashCreateResponse, BkashExecuteResponse, SslcommerzInitResponse, SslcommerzValidateResponse } from "./payment.interface";


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

export const createStripeCheckoutInDB = async (proposalId: string, requestedBy: RequestingUser) => {
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
export const markPaymentSucceededByProviderIdInDB = async (providerPaymentId: string) => {
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

export const markPaymentFailedByProviderIdInDB = async (providerPaymentId: string, reason?: string) => {
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
// BKASH
// ============================================================
// bKash's Tokenized Checkout only settles in BDT — proposals in any other
// currency are rejected here rather than silently charged at a 1:1 rate.

export const createBkashPaymentInDB = async (proposalId: string, requestedBy: RequestingUser) => {
	const proposal = await assertCanPayForProposal(proposalId, requestedBy);

	if (proposal.currency !== "BDT") {
		throw new AppError(StatusCodes.BAD_REQUEST, "bKash only supports BDT-denominated proposals. Use Stripe for other currencies.");
	}
	if (!config.bkash.baseUrl || !config.bkash.appKey || !config.bkash.callbackUrl) {
		throw new AppError(StatusCodes.SERVICE_UNAVAILABLE, "bKash is not configured.");
	}

	const idToken = await getBkashIdToken();

	const response = await fetch(`${config.bkash.baseUrl}/tokenized/checkout/create`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: idToken,
			"X-APP-Key": config.bkash.appKey,
		},
		body: JSON.stringify({
			mode: "0011",
			payerReference: proposal.id,
			callbackURL: config.bkash.callbackUrl,
			amount: proposal.total.toFixed(2),
			currency: "BDT",
			intent: "sale",
			merchantInvoiceNumber: proposal.proposalNumber,
		}),
	});

	if (!response.ok) {
		throw new AppError(StatusCodes.BAD_GATEWAY, "bKash payment creation failed.");
	}

	const result = (await response.json()) as BkashCreateResponse;

	if (!result.paymentID || !result.bkashURL) {
		throw new AppError(StatusCodes.BAD_GATEWAY, result.statusMessage ?? "bKash did not return a valid payment session.");
	}

	const payment = await prisma.payment.create({
		data: {
			proposalId: proposal.id,
			clientId: proposal.clientId,
			provider: "BKASH",
			providerPaymentId: result.paymentID,
			amount: proposal.total,
			currency: "BDT",
			status: "PENDING",
		},
	});

	return { paymentUrl: result.bkashURL, payment };
};

// bKash redirects the customer's browser back to our callbackURL with
// ?paymentID=...&status=... in the query string — this is NOT a signed webhook
// like Stripe's, so we re-verify by calling bKash's own execute endpoint
// rather than trusting the redirect status alone.
export const handleBkashCallbackInDB = async (paymentID: string, redirectStatus: string) => {
	const payment = await prisma.payment.findUnique({ where: { providerPaymentId: paymentID } });
	if (!payment) {
		throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found for this bKash paymentID.");
	}

	if (redirectStatus !== "success") {
		const status = redirectStatus === "cancel" ? "CANCELLED" : "FAILED";
		await prisma.payment.update({ where: { id: payment.id }, data: { status } });
		return { payment, redirectStatus: "failed" as const };
	}

	if (!config.bkash.baseUrl || !config.bkash.appKey) {
		throw new AppError(StatusCodes.SERVICE_UNAVAILABLE, "bKash is not configured.");
	}

	const idToken = await getBkashIdToken();

	const response = await fetch(`${config.bkash.baseUrl}/tokenized/checkout/execute`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: idToken,
			"X-APP-Key": config.bkash.appKey,
		},
		body: JSON.stringify({ paymentID }),
	});

	if (!response.ok) {
		await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
		throw new AppError(StatusCodes.BAD_GATEWAY, "bKash payment execution failed.");
	}

	const result = (await response.json()) as BkashExecuteResponse;

	if (result.transactionStatus !== "Completed") {
		await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
		return { payment, redirectStatus: "failed" as const };
	}

	const updated = await prisma.payment.update({
		where: { id: payment.id },
		data: { status: "SUCCEEDED", paidAt: new Date(), metadata: { trxID: result.trxID } as Prisma.InputJsonValue },
	});

	if (updated.proposalId) {
		await notifyProposalCreatorOfPayment(updated.proposalId, "bKash");
	}

	return { payment: updated, redirectStatus: "success" as const };
};

// ============================================================
// SSLCOMMERZ
// ============================================================
// Same BDT-only reasoning as bKash.

export const createSslcommerzPaymentInDB = async (proposalId: string, requestedBy: RequestingUser) => {
	const proposal = await assertCanPayForProposal(proposalId, requestedBy);

	if (proposal.currency !== "BDT") {
		throw new AppError(StatusCodes.BAD_REQUEST, "SSLCommerz only supports BDT-denominated proposals. Use Stripe for other currencies.");
	}
	if (!config.sslcommerz.storeId || !config.sslcommerz.storePassword) {
		throw new AppError(StatusCodes.SERVICE_UNAVAILABLE, "SSLCommerz is not configured.");
	}

	const client = proposal.clientId ? await prisma.client.findUnique({ where: { id: proposal.clientId } }) : null;
	const tranId = `${proposal.proposalNumber}-${Date.now()}`;

	// These callback URLs point at OUR backend (not the frontend) — SSLCommerz
	// posts the transaction result here, and our callback handler then redirects
	// the browser onward to the actual frontend page.
	const backendBaseUrl = config.betterAuth.url ?? primaryClientUrl();

	const apiResponse = (await sslcommerz.init({
		total_amount: proposal.total.toNumber(),
		currency: "BDT",
		tran_id: tranId,
		success_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/callback?status=success`,
		fail_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/callback?status=fail`,
		cancel_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/callback?status=cancel`,
		ipn_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/callback?status=ipn`,
		shipping_method: "NO",
		product_name: `Proposal ${proposal.proposalNumber}`,
		product_category: "Service",
		product_profile: "general",
		cus_name: client?.name ?? "Customer",
		cus_email: client?.email ?? "customer@example.com",
		cus_add1: client?.location ?? "N/A",
		cus_city: "N/A",
		cus_country: "Bangladesh",
		cus_phone: client?.phone ?? "N/A",
	})) as SslcommerzInitResponse;

	if (apiResponse.status !== "SUCCESS" || !apiResponse.GatewayPageURL) {
		throw new AppError(StatusCodes.BAD_GATEWAY, apiResponse.failedreason ?? "SSLCommerz session creation failed.");
	}

	const payment = await prisma.payment.create({
		data: {
			proposalId: proposal.id,
			clientId: proposal.clientId,
			provider: "SSLCOMMERZ",
			providerPaymentId: tranId,
			amount: proposal.total,
			currency: "BDT",
			status: "PENDING",
		},
	});

	return { paymentUrl: apiResponse.GatewayPageURL, payment };
};

export const handleSslcommerzCallbackInDB = async (tranId: string, status: string, valId?: string) => {
	const payment = await prisma.payment.findUnique({ where: { providerPaymentId: tranId } });
	if (!payment) {
		throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found for this transaction ID.");
	}

	if (status !== "success" || !valId) {
		const failedStatus = status === "cancel" ? "CANCELLED" : "FAILED";
		await prisma.payment.update({ where: { id: payment.id }, data: { status: failedStatus } });
		return { payment, redirectStatus: "failed" as const };
	}

	const validation = (await sslcommerz.validate({ val_id: valId })) as SslcommerzValidateResponse;

	if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
		await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
		return { payment, redirectStatus: "failed" as const };
	}

	const updated = await prisma.payment.update({
		where: { id: payment.id },
		data: { status: "SUCCEEDED", paidAt: new Date(), metadata: { valId } as Prisma.InputJsonValue },
	});

	if (updated.proposalId) {
		await notifyProposalCreatorOfPayment(updated.proposalId, "SSLCommerz");
	}

	return { payment: updated, redirectStatus: "success" as const };
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

export const refundStripePaymentInDB = async (id: string) => {
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
	createBkashPaymentInDB,
	handleBkashCallbackInDB,
	createSslcommerzPaymentInDB,
	handleSslcommerzCallbackInDB,
	getAllPaymentsFromDB,
	getPaymentByIdFromDB,
	getMyPaymentsFromDB,
	refundStripePaymentInDB,
};