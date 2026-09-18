import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { ClientReview } from "../../../generated/prisma/client";
import { clientReviewQueryConfig } from "./clientReview.constant";
import { notifyAdmins } from "../notification/notification.service";
import type { CreateReviewInput } from "./clientReview.interface";


const reviewDelegate = prisma.clientReview as unknown as PrismaDelegate<ClientReview>;

const getClientIdForUser = async (userId: string) => {
	const client = await prisma.client.findUnique({ where: { userId } });
	if (!client) {
		throw new AppError(StatusCodes.BAD_REQUEST, "No client profile is linked to your account.");
	}
	return client.id;
};

export const createMyClientReviewInDB = async (userId: string, payload: CreateReviewInput) => {
	const clientId = await getClientIdForUser(userId);

	// A review tied to a project must actually be one of this client's own projects.
	if (payload.projectId) {
		const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
		if (!project) {
			throw new AppError(StatusCodes.BAD_REQUEST, "The provided projectId does not match any project.");
		}
		if (project.clientId !== clientId) {
			throw new AppError(StatusCodes.FORBIDDEN, "You can only review your own projects.");
		}
	}

	const review = await prisma.clientReview.create({ data: { ...payload, clientId } as Prisma.ClientReviewUncheckedCreateInput });

	try {
		await notifyAdmins({
			type: "REVIEW_RECEIVED",
			entityType: "REVIEW",
			entityId: review.id,
			title: "New client review submitted",
			message: `A new ${payload.rating}-star review was submitted and is awaiting approval.`,
		});
	} catch (error) {
		console.error("[ClientReview] Failed to notify admins:", error);
	}

	return review;
};

export const getAllClientReviewsFromDB = async (query: Record<string, unknown>, { publicOnly }: { publicOnly: boolean }) => {
	const effectiveQuery: Record<string, unknown> = { ...query };
	if (publicOnly) {
		effectiveQuery.isApproved = "true";
	}

	const queryBuilder = new QueryBuilder<ClientReview>(reviewDelegate, clientReviewQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

export const getClientReviewByIdFromDB = async (id: string) => {
	const review = await prisma.clientReview.findUnique({ where: { id }, include: { client: true, project: true } });
	if (!review) {
		throw new AppError(StatusCodes.NOT_FOUND, "Review not found.");
	}
	return review;
};

export const updateReviewApprovalInDB = async (id: string, isApproved: boolean) => {
	const existing = await prisma.clientReview.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Review not found.");
	}
	return prisma.clientReview.update({ where: { id }, data: { isApproved } });
};

export const updateReviewFeaturedInDB = async (id: string, isFeatured: boolean) => {
	const existing = await prisma.clientReview.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Review not found.");
	}
	if (isFeatured && !existing.isApproved) {
		throw new AppError(StatusCodes.BAD_REQUEST, "Only an approved review can be featured.");
	}
	return prisma.clientReview.update({ where: { id }, data: { isFeatured } });
};

export const deleteClientReviewFromDB = async (id: string) => {
	const existing = await prisma.clientReview.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Review not found.");
	}
	await prisma.clientReview.delete({ where: { id } });
};

export const clientReviewService = {
	createMyClientReviewInDB,
	getAllClientReviewsFromDB,
	getClientReviewByIdFromDB,
	updateReviewApprovalInDB,
	updateReviewFeaturedInDB,
	deleteClientReviewFromDB,
};