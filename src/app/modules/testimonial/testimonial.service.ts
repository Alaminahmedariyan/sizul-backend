import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import type { Testimonial } from "../../../generated/prisma/client";
import { testimonialQueryConfig } from "./testimonial.constant";

type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type CreateTestimonialInput = {
	clientName: string;
	clientRole?: string;
	companyName?: string;
	clientImage?: string;
	content: string;
	rating: number;
	serviceName?: string;
	isFeatured: boolean;
};

type UpdateTestimonialInput = Partial<Omit<CreateTestimonialInput, "isFeatured">> & { isFeatured?: boolean };

const testimonialDelegate = prisma.testimonial as unknown as PrismaDelegate<Testimonial>;

const assertTestimonialExists = async (id: string) => {
	const testimonial = await prisma.testimonial.findUnique({ where: { id } });
	if (!testimonial) {
		throw new AppError(StatusCodes.NOT_FOUND, "Testimonial not found.");
	}
	return testimonial;
};

export const createTestimonialInDB = async (payload: CreateTestimonialInput) => {
	return prisma.testimonial.create({ data: payload });
};

export const getAllTestimonialsFromDB = async (query: Record<string, unknown>, { publicOnly }: { publicOnly: boolean }) => {
	const effectiveQuery: Record<string, unknown> = { ...query };
	if (publicOnly) {
		effectiveQuery.status = "PUBLISHED";
	}

	const queryBuilder = new QueryBuilder<Testimonial>(testimonialDelegate, testimonialQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

export const getTestimonialByIdFromDB = async (id: string) => {
	return assertTestimonialExists(id);
};

export const updateTestimonialInDB = async (id: string, payload: UpdateTestimonialInput) => {
	await assertTestimonialExists(id);
	return prisma.testimonial.update({ where: { id }, data: payload });
};

export const updateTestimonialStatusInDB = async (id: string, status: ContentStatus) => {
	const existing = await assertTestimonialExists(id);

	const publishedAt = status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt;

	return prisma.testimonial.update({ where: { id }, data: { status, publishedAt } });
};

export const deleteTestimonialFromDB = async (id: string) => {
	await assertTestimonialExists(id);
	await prisma.testimonial.delete({ where: { id } });
};
