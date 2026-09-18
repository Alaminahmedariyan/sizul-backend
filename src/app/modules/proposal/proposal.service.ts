import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Proposal } from "../../../generated/prisma/client";
import { proposalQueryConfig } from "./proposal.constant";
import { createNotification } from "../notification/notification.service";

type ProposalItemInput = {
	serviceId?: string;
	pricingPlanId?: string;
	title: string;
	description?: string;
	quantity: number;
	unitPrice: number;
};

type CreateProposalInput = {
	leadId?: string;
	clientId?: string;
	projectId?: string;
	title: string;
	introduction?: string;
	terms?: string;
	notes?: string;
	discount: number;
	tax: number;
	currency: string;
	validUntil?: Date;
	items: ProposalItemInput[];
};

type UpdateProposalInput = Partial<Omit<CreateProposalInput, "discount" | "tax" | "currency">> & {
	discount?: number;
	tax?: number;
	currency?: string;
};

const proposalDelegate = prisma.proposal as unknown as PrismaDelegate<Proposal>;

const assertReferencesExist = async (payload: { leadId?: string | null; clientId?: string | null; projectId?: string | null }) => {
	if (payload.leadId) {
		const lead = await prisma.lead.findUnique({ where: { id: payload.leadId } });
		if (!lead) throw new AppError(StatusCodes.BAD_REQUEST, "The provided leadId does not match any lead.");
	}
	if (payload.clientId) {
		const client = await prisma.client.findUnique({ where: { id: payload.clientId } });
		if (!client) throw new AppError(StatusCodes.BAD_REQUEST, "The provided clientId does not match any client.");
	}
	if (payload.projectId) {
		const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
		if (!project) throw new AppError(StatusCodes.BAD_REQUEST, "The provided projectId does not match any project.");
	}
};

const buildItemsData = (items: ProposalItemInput[]) => {
	let subtotal = new Prisma.Decimal(0);

	const data = items.map((item) => {
		const unitPrice = new Prisma.Decimal(item.unitPrice);
		const total = unitPrice.times(item.quantity);
		subtotal = subtotal.plus(total);

		return {
			...(item.serviceId !== undefined && { serviceId: item.serviceId }),
			...(item.pricingPlanId !== undefined && { pricingPlanId: item.pricingPlanId }),
			title: item.title,
			...(item.description !== undefined && { description: item.description }),
			quantity: item.quantity,
			unitPrice,
			total,
		};
	});

	return { data, subtotal };
};

const generateProposalNumber = async (): Promise<string> => {
	const year = new Date().getFullYear();

	for (let attempt = 0; attempt < 5; attempt++) {
		const count = await prisma.proposal.count({ where: { proposalNumber: { startsWith: `PRO-${year}-` } } });
		const sequence = String(count + 1 + attempt).padStart(4, "0");
		const candidate = `PRO-${year}-${sequence}`;

		const existing = await prisma.proposal.findUnique({ where: { proposalNumber: candidate } });
		if (!existing) return candidate;
	}

	throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate a unique proposal number. Please try again.");
};

const assertProposalExists = async (id: string) => {
	const proposal = await prisma.proposal.findUnique({ where: { id } });
	if (!proposal) {
		throw new AppError(StatusCodes.NOT_FOUND, "Proposal not found.");
	}
	return proposal;
};

const assertIsDraft = (proposal: Proposal) => {
	if (proposal.status !== "DRAFT") {
		throw new AppError(StatusCodes.BAD_REQUEST, "Only proposals in DRAFT status can be modified or deleted.");
	}
};

 const createProposalInDB = async (payload: CreateProposalInput, createdById: string) => {
	await assertReferencesExist(payload);

	const { data: itemsData, subtotal } = buildItemsData(payload.items);
	const discount = new Prisma.Decimal(payload.discount);
	const tax = new Prisma.Decimal(payload.tax);
	const total = subtotal.minus(discount).plus(tax);

	const proposalNumber = await generateProposalNumber();

	return prisma.proposal.create({
		data: {
			...(payload.leadId !== undefined && { leadId: payload.leadId }),
			...(payload.clientId !== undefined && { clientId: payload.clientId }),
			...(payload.projectId !== undefined && { projectId: payload.projectId }),
			proposalNumber,
			title: payload.title,
			...(payload.introduction !== undefined && { introduction: payload.introduction }),
			...(payload.terms !== undefined && { terms: payload.terms }),
			...(payload.notes !== undefined && { notes: payload.notes }),
			subtotal,
			discount,
			tax,
			total,
			currency: payload.currency,
			...(payload.validUntil !== undefined && { validUntil: payload.validUntil }),
			createdById,
			items: { create: itemsData },
		},
		include: { items: true },
	});
};

 const getAllProposalsFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<Proposal>(proposalDelegate, proposalQueryConfig);
	return queryBuilder.execute(query);
};

 const getProposalByIdFromDB = async (id: string) => {
	const proposal = await prisma.proposal.findUnique({
		where: { id },
		include: {
			items: { include: { service: true, pricingPlan: true } },
			lead: true,
			client: true,
			project: true,
			createdBy: { select: { id: true, name: true, email: true } },
			payments: { orderBy: { createdAt: "desc" } },
		},
	});

	if (!proposal) {
		throw new AppError(StatusCodes.NOT_FOUND, "Proposal not found.");
	}

	return proposal;
};

 const updateProposalInDB = async (id: string, payload: UpdateProposalInput) => {
	const existing = await assertProposalExists(id);
	assertIsDraft(existing);
	await assertReferencesExist(payload);

	let subtotal = existing.subtotal;
	let itemsUpdate: Prisma.ProposalUpdateInput["items"] | undefined;

	if (payload.items) {
		const built = buildItemsData(payload.items);
		subtotal = built.subtotal;
		itemsUpdate = { deleteMany: {}, create: built.data };
	}

	const discount = payload.discount !== undefined ? new Prisma.Decimal(payload.discount) : existing.discount;
	const tax = payload.tax !== undefined ? new Prisma.Decimal(payload.tax) : existing.tax;
	const total = subtotal.minus(discount).plus(tax);

	return prisma.proposal.update({
		where: { id },
		data: {
			...(payload.leadId !== undefined && { leadId: payload.leadId }),
			...(payload.clientId !== undefined && { clientId: payload.clientId }),
			...(payload.projectId !== undefined && { projectId: payload.projectId }),
			...(payload.title !== undefined && { title: payload.title }),
			...(payload.introduction !== undefined && { introduction: payload.introduction }),
			...(payload.terms !== undefined && { terms: payload.terms }),
			...(payload.notes !== undefined && { notes: payload.notes }),
			...(payload.currency !== undefined && { currency: payload.currency }),
			...(payload.validUntil !== undefined && { validUntil: payload.validUntil }),
			subtotal,
			discount,
			tax,
			total,
			...(itemsUpdate && { items: itemsUpdate }),
		},
		include: { items: true },
	});
};

 const sendProposalInDB = async (id: string) => {
	const existing = await assertProposalExists(id);
	if (existing.status !== "DRAFT") {
		throw new AppError(StatusCodes.BAD_REQUEST, "Only a DRAFT proposal can be sent.");
	}

	const updated = await prisma.proposal.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });

	if (existing.clientId) {
		try {
			const client = await prisma.client.findUnique({ where: { id: existing.clientId }, select: { userId: true } });
			if (client?.userId) {
				await createNotification({
					userId: client.userId,
					type: "PROPOSAL_SENT",
					entityType: "PROPOSAL",
					entityId: id,
					title: "New proposal received",
					message: `A new proposal "${existing.title}" (${existing.proposalNumber}) has been sent to you.`,
				});
			}
		} catch (error) {
			console.error("[Proposal] Failed to notify client of sent proposal:", error);
		}
	}

	return updated;
};

 const markProposalViewedInDB = async (id: string) => {
	const existing = await assertProposalExists(id);
	if (existing.status !== "SENT") {
		throw new AppError(StatusCodes.BAD_REQUEST, "Only a SENT proposal can be marked as viewed.");
	}

	return prisma.proposal.update({ where: { id }, data: { status: "VIEWED", viewedAt: new Date() } });
};

 const acceptProposalInDB = async (id: string) => {
	const existing = await assertProposalExists(id);
	if (existing.status !== "SENT" && existing.status !== "VIEWED") {
		throw new AppError(StatusCodes.BAD_REQUEST, "Only a SENT or VIEWED proposal can be accepted.");
	}

	const updated = await prisma.proposal.update({ where: { id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });

	try {
		await createNotification({
			userId: existing.createdById,
			type: "PROPOSAL_ACCEPTED",
			entityType: "PROPOSAL",
			entityId: id,
			title: "Proposal accepted! \ud83c\udf89",
			message: `Your proposal "${existing.title}" (${existing.proposalNumber}) was accepted.`,
		});
	} catch (error) {
		console.error("[Proposal] Failed to notify creator of acceptance:", error);
	}

	return updated;
};

 const rejectProposalInDB = async (id: string) => {
	const existing = await assertProposalExists(id);
	if (existing.status !== "SENT" && existing.status !== "VIEWED") {
		throw new AppError(StatusCodes.BAD_REQUEST, "Only a SENT or VIEWED proposal can be rejected.");
	}

	const updated = await prisma.proposal.update({ where: { id }, data: { status: "REJECTED", rejectedAt: new Date() } });

	try {
		await createNotification({
			userId: existing.createdById,
			type: "PROPOSAL_REJECTED",
			entityType: "PROPOSAL",
			entityId: id,
			title: "Proposal rejected",
			message: `Your proposal "${existing.title}" (${existing.proposalNumber}) was rejected.`,
		});
	} catch (error) {
		console.error("[Proposal] Failed to notify creator of rejection:", error);
	}

	return updated;
};

 const deleteProposalFromDB = async (id: string) => {
	const existing = await assertProposalExists(id);
	assertIsDraft(existing);

	await prisma.proposal.delete({ where: { id } });
};

export const proposalService = {
	createProposalInDB,
	getAllProposalsFromDB,
	getProposalByIdFromDB,
	updateProposalInDB,
	sendProposalInDB,
	markProposalViewedInDB,
	acceptProposalInDB,
	rejectProposalInDB,
	deleteProposalFromDB,
};