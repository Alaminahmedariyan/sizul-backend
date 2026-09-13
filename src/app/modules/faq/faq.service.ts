import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import type { FAQ } from "../../../generated/prisma/client";
import { faqQueryConfig } from "./faq.constant";

type CreateFaqInput = { question: string; answer: string; category?: string; isActive: boolean; order: number };
type UpdateFaqInput = { question?: string; answer?: string; category?: string | null; isActive?: boolean; order?: number };

const faqDelegate = prisma.fAQ as unknown as PrismaDelegate<FAQ>;

const assertFaqExists = async (id: string) => {
	const faq = await prisma.fAQ.findUnique({ where: { id } });
	if (!faq) {
		throw new AppError(StatusCodes.NOT_FOUND, "FAQ not found.");
	}
	return faq;
};

export const createFaqInDB = async (payload: CreateFaqInput) => {
	return prisma.fAQ.create({ data: payload });
};

export const getAllFaqsFromDB = async (query: Record<string, unknown>, { publicOnly }: { publicOnly: boolean }) => {
	const effectiveQuery: Record<string, unknown> = { ...query };
	if (publicOnly) {
		effectiveQuery.isActive = "true";
	}
	if (!effectiveQuery.sort && !effectiveQuery.sortBy) {
		effectiveQuery.sortBy = "order";
		effectiveQuery.sortOrder = "asc";
	}

	const queryBuilder = new QueryBuilder<FAQ>(faqDelegate, faqQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

export const getFaqByIdFromDB = async (id: string) => {
	return assertFaqExists(id);
};

export const updateFaqInDB = async (id: string, payload: UpdateFaqInput) => {
	await assertFaqExists(id);
	return prisma.fAQ.update({ where: { id }, data: payload });
};

export const deleteFaqFromDB = async (id: string) => {
	await assertFaqExists(id);
	await prisma.fAQ.delete({ where: { id } });
};
