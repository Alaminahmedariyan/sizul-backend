import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { PricingPlan } from "../../../generated/prisma/client";
import { pricingPlanQueryConfig } from "./pricingPlan.constant";

type BillingInterval = "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";

type CreatePricingPlanInput = {
	serviceId: string;
	slug: string;
	name: string;
	description?: string;
	price: number;
	currency: string;
	billingInterval: BillingInterval;
	features?: unknown;
	isPopular: boolean;
	isActive: boolean;
	order: number;
};

type UpdatePricingPlanInput = Partial<Omit<CreatePricingPlanInput, "currency" | "isPopular" | "isActive" | "order">> & {
	currency?: string;
	isPopular?: boolean;
	isActive?: boolean;
	order?: number;
};

const pricingPlanDelegate = prisma.pricingPlan as unknown as PrismaDelegate<PricingPlan>;

const assertServiceExists = async (serviceId: string) => {
	const service = await prisma.service.findUnique({ where: { id: serviceId } });
	if (!service) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided serviceId does not match any service.");
	}
};

const toPrismaData = <T extends { price?: number; features?: unknown }>(payload: T) => ({
	...payload,
	...(payload.price !== undefined && { price: new Prisma.Decimal(payload.price) }),
	...(payload.features !== undefined && { features: payload.features as Prisma.InputJsonValue | null }),
});

export const createPricingPlanInDB = async (payload: CreatePricingPlanInput) => {
	await assertServiceExists(payload.serviceId);
	return prisma.pricingPlan.create({ data: toPrismaData(payload) });
};

export const getAllPricingPlansFromDB = async (query: Record<string, unknown>, { publicOnly }: { publicOnly: boolean }) => {
	const effectiveQuery: Record<string, unknown> = { ...query };

	if (publicOnly) {
		effectiveQuery.isActive = "true";
	}
	if (!effectiveQuery.sort && !effectiveQuery.sortBy) {
		effectiveQuery.sortBy = "order";
		effectiveQuery.sortOrder = "asc";
	}

	const queryBuilder = new QueryBuilder<PricingPlan>(pricingPlanDelegate, pricingPlanQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

export const getPricingPlanByIdFromDB = async (id: string) => {
	const plan = await prisma.pricingPlan.findUnique({ where: { id }, include: { service: true } });
	if (!plan) {
		throw new AppError(StatusCodes.NOT_FOUND, "Pricing plan not found.");
	}
	return plan;
};

export const updatePricingPlanInDB = async (id: string, payload: UpdatePricingPlanInput) => {
	const existing = await prisma.pricingPlan.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Pricing plan not found.");
	}

	if (payload.serviceId) {
		await assertServiceExists(payload.serviceId);
	}

	return prisma.pricingPlan.update({ where: { id }, data: toPrismaData(payload) });
};

export const deletePricingPlanFromDB = async (id: string) => {
	const existing = await prisma.pricingPlan.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Pricing plan not found.");
	}

	await prisma.pricingPlan.delete({ where: { id } });
};
