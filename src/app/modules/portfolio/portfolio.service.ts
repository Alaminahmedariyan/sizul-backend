import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Portfolio } from "../../../generated/prisma/client";
import { portfolioQueryConfig } from "./portfolio.constant";
import type { AddPortfolioImageInput, ContentStatus, CreatePortfolioInput, UpdatePortfolioInput } from "./portfolio.interface";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../../utils/fileUploader";
// ADJUST THIS PATH if your Cloudinary upload util lives somewhere else:


const portfolioDelegate = prisma.portfolio as unknown as PrismaDelegate<Portfolio>;

const toPrismaData = <T extends { technologies?: unknown; results?: unknown }>(payload: T) => ({
	...payload,
	...(payload.technologies !== undefined && {
		technologies: payload.technologies === null ? Prisma.JsonNull : (payload.technologies as Prisma.InputJsonValue),
	}),
	...(payload.results !== undefined && {
		results: payload.results === null ? Prisma.JsonNull : (payload.results as Prisma.InputJsonValue),
	}),
});

const assertPortfolioExists = async (id: string) => {
	const portfolio = await prisma.portfolio.findUnique({ where: { id } });
	if (!portfolio) {
		throw new AppError(StatusCodes.NOT_FOUND, "Portfolio item not found.");
	}
	return portfolio;
};

const createPortfolioInDB = async (payload: CreatePortfolioInput) => {
	return prisma.portfolio.create({ data: toPrismaData(payload) as Prisma.PortfolioUncheckedCreateInput });
};

const getAllPortfoliosFromDB = async (query: Record<string, unknown>, { publicOnly }: { publicOnly: boolean }) => {
	const effectiveQuery: Record<string, unknown> = { ...query };
	if (publicOnly) {
		effectiveQuery.status = "PUBLISHED";
	}

	const queryBuilder = new QueryBuilder<Portfolio>(portfolioDelegate, portfolioQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

const getPortfolioBySlugFromDB = async (slug: string, { publicOnly }: { publicOnly: boolean }) => {
	const portfolio = await prisma.portfolio.findUnique({
		where: { slug },
		include: { images: { orderBy: { order: "asc" } }, services: { include: { service: true } } },
	});

	if (!portfolio || (publicOnly && portfolio.status !== "PUBLISHED")) {
		throw new AppError(StatusCodes.NOT_FOUND, "Portfolio item not found.");
	}

	return portfolio;
};

const getPortfolioByIdFromDB = async (id: string) => {
	const portfolio = await prisma.portfolio.findUnique({
		where: { id },
		include: { images: { orderBy: { order: "asc" } }, services: { include: { service: true } } },
	});

	if (!portfolio) {
		throw new AppError(StatusCodes.NOT_FOUND, "Portfolio item not found.");
	}

	return portfolio;
};

const updatePortfolioInDB = async (id: string, payload: UpdatePortfolioInput) => {
	await assertPortfolioExists(id);
	return prisma.portfolio.update({ where: { id }, data: toPrismaData(payload) as Prisma.PortfolioUncheckedUpdateInput });
};

const updatePortfolioStatusInDB = async (id: string, status: ContentStatus) => {
	const existing = await assertPortfolioExists(id);

	// Preserve the first-published date even if later moved to DRAFT/ARCHIVED and
	// back — only stamp publishedAt the first time it goes PUBLISHED.
	const publishedAt = status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt;

	return prisma.portfolio.update({ where: { id }, data: { status, publishedAt } });
};

// Real file upload — the image is sent as multipart/form-data (field "file"),
// uploaded to Cloudinary here, and only the resulting URL/publicId are stored.
const addPortfolioImageInDB = async (portfolioId: string, file: Express.Multer.File, payload: AddPortfolioImageInput) => {
	await assertPortfolioExists(portfolioId);

	const uploadResult = await uploadFileToCloudinary(file.buffer, file.originalname, `portfolio/${portfolioId}`);

	return prisma.portfolioImage.create({
		data: {
			portfolioId,
			url: uploadResult.secure_url,
			publicId: uploadResult.public_id,
			...payload,
		} as Prisma.PortfolioImageUncheckedCreateInput,
	});
};

const removePortfolioImageFromDB = async (imageId: string) => {
	const existing = await prisma.portfolioImage.findUnique({ where: { id: imageId } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Portfolio image not found.");
	}

	if (existing.publicId) {
		try {
			await deleteFileFromCloudinary(existing.publicId);
		} catch (error) {
			console.error("[Portfolio] Failed to delete Cloudinary asset:", error);
		}
	}

	await prisma.portfolioImage.delete({ where: { id: imageId } });
};

const linkPortfolioServiceInDB = async (portfolioId: string, serviceId: string) => {
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

const unlinkPortfolioServiceFromDB = async (portfolioId: string, serviceId: string) => {
	const existing = await prisma.portfolioService.findUnique({
		where: { portfolioId_serviceId: { portfolioId, serviceId } },
	});
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "This service is not linked to this portfolio item.");
	}

	await prisma.portfolioService.delete({ where: { portfolioId_serviceId: { portfolioId, serviceId } } });
};

const deletePortfolioFromDB = async (id: string) => {
	await assertPortfolioExists(id);
	await prisma.portfolio.delete({ where: { id } });
};

export const portfolioService = {
	createPortfolioInDB,
	getAllPortfoliosFromDB,
	getPortfolioBySlugFromDB,
	getPortfolioByIdFromDB,
	updatePortfolioInDB,
	updatePortfolioStatusInDB,
	addPortfolioImageInDB,
	removePortfolioImageFromDB,
	linkPortfolioServiceInDB,
	unlinkPortfolioServiceFromDB,
	deletePortfolioFromDB,
};