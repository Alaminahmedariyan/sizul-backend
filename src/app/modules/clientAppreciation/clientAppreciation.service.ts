import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { ClientAppreciation } from "../../../generated/prisma/client";
import { clientAppreciationQueryConfig } from "./clientAppreciation.constant";
import type { AppreciationType, CreateAppreciationInput, UpdateAppreciationInput } from "./clientAppreciation.interface";


const appreciationDelegate = prisma.clientAppreciation as unknown as PrismaDelegate<ClientAppreciation>;

const toPrismaData = <T extends { amount?: number | null }>(payload: T) => ({
	...payload,
	...(payload.amount !== undefined && { amount: payload.amount === null ? null : new Prisma.Decimal(payload.amount) }),
});

const assertClientExists = async (clientId: string) => {
	const client = await prisma.client.findUnique({ where: { id: clientId } });
	if (!client) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided clientId does not match any client.");
	}
};

const assertProjectExists = async (projectId: string) => {
	const project = await prisma.project.findUnique({ where: { id: projectId } });
	if (!project) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided projectId does not match any project.");
	}
};

const assertAppreciationExists = async (id: string) => {
	const appreciation = await prisma.clientAppreciation.findUnique({ where: { id } });
	if (!appreciation) {
		throw new AppError(StatusCodes.NOT_FOUND, "Appreciation record not found.");
	}
	return appreciation;
};

const createAppreciationInDB = async (payload: CreateAppreciationInput) => {
	await assertClientExists(payload.clientId);
	if (payload.projectId) {
		await assertProjectExists(payload.projectId);
	}

	return prisma.clientAppreciation.create({ data: toPrismaData(payload) as Prisma.ClientAppreciationUncheckedCreateInput });
};

export const getAllAppreciationsFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<ClientAppreciation>(appreciationDelegate, clientAppreciationQueryConfig);
	return queryBuilder.execute(query);
};

export const getAppreciationByIdFromDB = async (id: string) => {
	const appreciation = await prisma.clientAppreciation.findUnique({
		where: { id },
		include: { client: true, project: true },
	});

	if (!appreciation) {
		throw new AppError(StatusCodes.NOT_FOUND, "Appreciation record not found.");
	}

	return appreciation;
};

const updateAppreciationInDB = async (id: string, payload: UpdateAppreciationInput) => {
	await assertAppreciationExists(id);

	if (payload.projectId) {
		await assertProjectExists(payload.projectId);
	}

	return prisma.clientAppreciation.update({ where: { id }, data: toPrismaData(payload) as Prisma.ClientAppreciationUncheckedUpdateInput });
};

export const deleteAppreciationFromDB = async (id: string) => {
	await assertAppreciationExists(id);
	await prisma.clientAppreciation.delete({ where: { id } });
};

export const clientAppreciationService = {
	createAppreciationInDB,
	getAllAppreciationsFromDB,
	getAppreciationByIdFromDB,
	updateAppreciationInDB,
	deleteAppreciationFromDB,
};
