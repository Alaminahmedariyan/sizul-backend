import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Portfolio } from "../../../generated/prisma/client";
import { portfolioQueryConfig } from "./portfolio.constant";

type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type CreatePortfolioInput = {
	title: string;
	slug: string;
	clientName?: string;
	industry?: string;
	location?: string;
	websiteUrl?: string;
	coverImage?: string;
	description?: string;
	technologies?: unknown;
	duration?: string;
	results?: unknown;
	seoTitle?: string;
	seoDescription?: string;
	isFeatured: boolean;
};

type UpdatePortfolioInput = Partial<Omit<CreatePortfolioInput, "isFeatured">> & { isFeatured?: boolean };

const portfolioDelegate = prisma.portfolio as unknown as PrismaDelegate<Portfolio>;

const toPrismaData = <T extends { technologies?: unknown; results?: unknown }>(payload: T) => ({
	...payload,
	...(payload.technologies !== undefined && { technologies: payload.technologies as Prisma.InputJsonValue | null }),
	...(payload.results !== undefined && { results: payload.results as Prisma.InputJsonValue | null }),
});

const assertPortfolioExists = async (id: string) => {
	const portfolio = await prisma.portfolio.findUnique({ where: { id } });
	if (!portfolio) {
		throw new AppError(StatusCodes.NOT_FOUND, "Portfolio item not found.");
	}
	return portfolio;
};

export const createPortfolioInDB = async (payload: CreatePortfolioInput) => {
	return prisma.portfolio.create({ data: toPrismaData(payload) });
};

export const getAllPortfoliosFromDB = async (query: Record<string, unknown>, { publicOnly }: { publicOnly: boolean }) => {
	const effectiveQuery: Record<string, unknown> = { ...query };
	if (publicOnly) {
		effectiveQuery.status = "PUBLISHED";
	}

	const queryBuilder = new QueryBuilder<Portfolio>(portfolioDelegate, portfolioQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

export const getPortfolioBySlugFromDB = async (slug: string, { publicOnly }: { publicOnly: boolean }) => {
	const portfolio = await prisma.portfolio.findUnique({
		where: { slug },
		include: { images: { orderBy: { order: "asc" } }, services: { include: { service: true } } },
	});

	if (!portfolio || (publicOnly && portfolio.status !== "PUBLISHED")) {
		throw new AppError(StatusCodes.NOT_FOUND, "Portfolio item not found.");
	}

	return portfolio;
};

export const getPortfolioByIdFromDB = async (id: string) => {
	const portfolio = await prisma.portfolio.findUnique({
		where: { id },
		include: { images: { orderBy: { order: "asc" } }, services: { include: { service: true } } },
	});

	if (!portfolio) {
		throw new AppError(StatusCodes.NOT_FOUND, "Portfolio item not found.");
	}

	return portfolio;
};

export const updatePortfolioInDB = async (id: string, payload: UpdatePortfolioInput) => {
	await assertPortfolioExists(id);
	return prisma.portfolio.update({ where: { id }, data: toPrismaData(payload) });
};

export const updatePortfolioStatusInDB = async (id: string, status: ContentStatus) => {
	const existing = await assertPortfolioExists(id);

	// Preserve the first-published date even if later moved to DRAFT/ARCHIVED and
	// back — only stamp publishedAt the first time it goes PUBLISHED.
	const publishedAt = status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt;

	return prisma.portfolio.update({ where: { id }, data: { status, publishedAt } });
};

export const addPortfolioImageInDB = async (
	portfolioId: string,
	payload: { url: string; altText?: string; caption?: string; order: number },
) => {
	await assertPortfolioExists(portfolioId);
	return prisma.portfolioImage.create({ data: { portfolioId, ...payload } });
};

export const removePortfolioImageFromDB = async (imageId: string) => {
	const existing = await prisma.portfolioImage.findUnique({ where: { id: imageId } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Portfolio image not found.");
	}
	await prisma.portfolioImage.delete({ where: { id: imageId } });
};

export const linkPortfolioServiceInDB = async (portfolioId: string, serviceId: string) => {
	await assertPortfolioExists(portfolioId);

	const service = await prisma.service.findUnique({ where: { id: serviceId } });
	if (!service) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided serviceId does not match any service.");
	}

	const existing = await prisma.portfolioService.findUnique({
		where: { portfolioId_serviceId: { portfolioId, serviceId } },
	});
	if (existing) {
		throw new AppError(StatusCodes.CONFLICT, "This service is already linked to this portfolio item.");
	}

	return prisma.portfolioService.create({ data: { portfolioId, serviceId } });
};

export const unlinkPortfolioServiceFromDB = async (portfolioId: string, serviceId: string) => {
	const existing = await prisma.portfolioService.findUnique({
		where: { portfolioId_serviceId: { portfolioId, serviceId } },
	});
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "This service is not linked to this portfolio item.");
	}

	await prisma.portfolioService.delete({ where: { portfolioId_serviceId: { portfolioId, serviceId } } });
};

export const deletePortfolioFromDB = async (id: string) => {
	await assertPortfolioExists(id);
	await prisma.portfolio.delete({ where: { id } });
};