import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Service } from "../../../generated/prisma/client";
import { serviceQueryConfig } from "./service.constant";
import type { CreateServiceInput, UpdateServiceInput } from "./service.interface";

const serviceDelegate = prisma.service as unknown as PrismaDelegate<Service>;

const toPrismaData = <T extends { startingPrice?: number | null; features?: unknown; process?: unknown }>(
	payload: T,
) => ({
	...payload,
	...(payload.startingPrice !== undefined && {
		startingPrice: payload.startingPrice === null ? null : new Prisma.Decimal(payload.startingPrice),
	}),
	...(payload.features !== undefined && {
		features: payload.features === null ? Prisma.JsonNull : (payload.features as Prisma.InputJsonValue),
	}),
	...(payload.process !== undefined && {
		process: payload.process === null ? Prisma.JsonNull : (payload.process as Prisma.InputJsonValue),
	}),
});

 const createServiceInDB = async (payload: CreateServiceInput) => {
	return prisma.service.create({ data: toPrismaData(payload) as Prisma.ServiceUncheckedCreateInput });
};

 const getAllServicesFromDB = async (query: Record<string, unknown>, { publicOnly }: { publicOnly: boolean }) => {
	const effectiveQuery: Record<string, unknown> = { ...query };

	if (publicOnly) {
		effectiveQuery.isActive = "true";
	}

	// Ascending "order" by default — see the comment in service.constant.ts for why
	// this can't just be QueryConfig.defaultSortField.
	if (!effectiveQuery.sort && !effectiveQuery.sortBy) {
		effectiveQuery.sortBy = "order";
		effectiveQuery.sortOrder = "asc";
	}

	const queryBuilder = new QueryBuilder<Service>(serviceDelegate, serviceQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

 const getServiceBySlugFromDB = async (slug: string, { publicOnly }: { publicOnly: boolean }) => {
	const service = await prisma.service.findUnique({
		where: { slug },
		include: {
			pricingPlans: {
				...(publicOnly && { where: { isActive: true } }),
				orderBy: { order: "asc" },
			},
		},
	});

	if (!service || (publicOnly && !service.isActive)) {
		throw new AppError(StatusCodes.NOT_FOUND, "Service not found.");
	}

	return service;
};

 const getServiceByIdFromDB = async (id: string) => {
	const service = await prisma.service.findUnique({
		where: { id },
		include: { pricingPlans: { orderBy: { order: "asc" } } },
	});

	if (!service) {
		throw new AppError(StatusCodes.NOT_FOUND, "Service not found.");
	}

	return service;
};

 const updateServiceInDB = async (id: string, payload: UpdateServiceInput) => {
	const existing = await prisma.service.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Service not found.");
	}

	return prisma.service.update({ where: { id }, data: toPrismaData(payload) as Prisma.ServiceUncheckedUpdateInput });
};

 const deleteServiceFromDB = async (id: string) => {
	const existing = await prisma.service.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Service not found.");
	}

	await prisma.service.delete({ where: { id } });
};

export const serviceService = {
	createServiceInDB,
	getAllServicesFromDB,
	getServiceBySlugFromDB,
	getServiceByIdFromDB,
	updateServiceInDB,
	deleteServiceFromDB,
};
