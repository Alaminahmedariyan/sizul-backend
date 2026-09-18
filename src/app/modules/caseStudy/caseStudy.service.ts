import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { CaseStudy } from "../../../generated/prisma/client";
import { caseStudyQueryConfig } from "./caseStudy.constant";
import type { ContentStatus, CreateCaseStudyInput, UpdateCaseStudyInput } from "./caseStudy.interface";


const caseStudyDelegate = prisma.caseStudy as unknown as PrismaDelegate<CaseStudy>;

const toPrismaData = <T extends { metrics?: unknown }>(payload: T) => ({
	...payload,
	...(payload.metrics !== undefined && {
		metrics: payload.metrics === null ? Prisma.JsonNull : (payload.metrics as Prisma.InputJsonValue),
	}),
});

const assertCaseStudyExists = async (id: string) => {
	const caseStudy = await prisma.caseStudy.findUnique({ where: { id } });
	if (!caseStudy) {
		throw new AppError(StatusCodes.NOT_FOUND, "Case study not found.");
	}
	return caseStudy;
};

export const createCaseStudyInDB = async (payload: CreateCaseStudyInput) => {
	return prisma.caseStudy.create({ data: toPrismaData(payload) as Prisma.CaseStudyUncheckedCreateInput });
};

export const getAllCaseStudiesFromDB = async (query: Record<string, unknown>, { publicOnly }: { publicOnly: boolean }) => {
	const effectiveQuery: Record<string, unknown> = { ...query };
	if (publicOnly) {
		effectiveQuery.status = "PUBLISHED";
	}

	const queryBuilder = new QueryBuilder<CaseStudy>(caseStudyDelegate, caseStudyQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

export const getCaseStudyBySlugFromDB = async (slug: string, { publicOnly }: { publicOnly: boolean }) => {
	const caseStudy = await prisma.caseStudy.findUnique({
		where: { slug },
		include: { services: { include: { service: true } } },
	});

	if (!caseStudy || (publicOnly && caseStudy.status !== "PUBLISHED")) {
		throw new AppError(StatusCodes.NOT_FOUND, "Case study not found.");
	}

	return caseStudy;
};

export const getCaseStudyByIdFromDB = async (id: string) => {
	const caseStudy = await prisma.caseStudy.findUnique({
		where: { id },
		include: { services: { include: { service: true } } },
	});

	if (!caseStudy) {
		throw new AppError(StatusCodes.NOT_FOUND, "Case study not found.");
	}

	return caseStudy;
};

export const updateCaseStudyInDB = async (id: string, payload: UpdateCaseStudyInput) => {
	await assertCaseStudyExists(id);
	return prisma.caseStudy.update({ where: { id }, data: toPrismaData(payload) as Prisma.CaseStudyUncheckedUpdateInput });
};

export const updateCaseStudyStatusInDB = async (id: string, status: ContentStatus) => {
	const existing = await assertCaseStudyExists(id);

	const publishedAt = status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt;

	return prisma.caseStudy.update({ where: { id }, data: { status, publishedAt } });
};

export const linkCaseStudyServiceInDB = async (caseStudyId: string, serviceId: string) => {
	await assertCaseStudyExists(caseStudyId);

	const service = await prisma.service.findUnique({ where: { id: serviceId } });
	if (!service) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided serviceId does not match any service.");
	}

	const existing = await prisma.caseStudyService.findUnique({
		where: { caseStudyId_serviceId: { caseStudyId, serviceId } },
	});
	if (existing) {
		throw new AppError(StatusCodes.CONFLICT, "This service is already linked to this case study.");
	}

	return prisma.caseStudyService.create({ data: { caseStudyId, serviceId } });
};

export const unlinkCaseStudyServiceFromDB = async (caseStudyId: string, serviceId: string) => {
	const existing = await prisma.caseStudyService.findUnique({
		where: { caseStudyId_serviceId: { caseStudyId, serviceId } },
	});
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "This service is not linked to this case study.");
	}

	await prisma.caseStudyService.delete({ where: { caseStudyId_serviceId: { caseStudyId, serviceId } } });
};

export const deleteCaseStudyFromDB = async (id: string) => {
	await assertCaseStudyExists(id);
	await prisma.caseStudy.delete({ where: { id } });
};

export const caseStudyService = {
	createCaseStudyInDB,
	getAllCaseStudiesFromDB,
	getCaseStudyBySlugFromDB,
	getCaseStudyByIdFromDB,
	updateCaseStudyInDB,
	updateCaseStudyStatusInDB,
	linkCaseStudyServiceInDB,
	unlinkCaseStudyServiceFromDB,
	deleteCaseStudyFromDB,
};