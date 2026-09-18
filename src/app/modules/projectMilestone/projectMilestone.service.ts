import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { ProjectMilestone } from "../../../generated/prisma/client";
import { projectMilestoneQueryConfig } from "./projectMilestone.constant";
import type { MilestoneStatus, CreateMilestoneInput, UpdateMilestoneInput } from "./projectMilestone.interface";

const milestoneDelegate = prisma.projectMilestone as unknown as PrismaDelegate<ProjectMilestone>;

const assertProjectExists = async (projectId: string) => {
	const project = await prisma.project.findUnique({ where: { id: projectId } });
	if (!project) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided projectId does not match any project.");
	}
};

const assertMilestoneExists = async (id: string) => {
	const milestone = await prisma.projectMilestone.findUnique({ where: { id } });
	if (!milestone) {
		throw new AppError(StatusCodes.NOT_FOUND, "Milestone not found.");
	}
	return milestone;
};

 const createMilestoneInDB = async (payload: CreateMilestoneInput) => {
	await assertProjectExists(payload.projectId);
	return prisma.projectMilestone.create({ data: payload as Prisma.ProjectMilestoneUncheckedCreateInput });
};

 const getAllMilestonesFromDB = async (query: Record<string, unknown>) => {
	const effectiveQuery: Record<string, unknown> = { ...query };
	if (!effectiveQuery.sort && !effectiveQuery.sortBy) {
		effectiveQuery.sortBy = "order";
		effectiveQuery.sortOrder = "asc";
	}

	const queryBuilder = new QueryBuilder<ProjectMilestone>(milestoneDelegate, projectMilestoneQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

 const getMilestoneByIdFromDB = async (id: string) => {
	const milestone = await prisma.projectMilestone.findUnique({
		where: { id },
		include: { project: true, tasks: { orderBy: { createdAt: "desc" } } },
	});

	if (!milestone) {
		throw new AppError(StatusCodes.NOT_FOUND, "Milestone not found.");
	}

	return milestone;
};

 const updateMilestoneInDB = async (id: string, payload: UpdateMilestoneInput) => {
	await assertMilestoneExists(id);
	return prisma.projectMilestone.update({ where: { id }, data: payload as Prisma.ProjectMilestoneUncheckedUpdateInput });
};

 const updateMilestoneStatusInDB = async (id: string, status: MilestoneStatus) => {
	const existing = await assertMilestoneExists(id);

	const completedAt = status === "COMPLETED" ? new Date() : existing.status === "COMPLETED" ? null : existing.completedAt;

	return prisma.projectMilestone.update({ where: { id }, data: { status, completedAt } });
};

 const deleteMilestoneFromDB = async (id: string) => {
	await assertMilestoneExists(id);
	await prisma.projectMilestone.delete({ where: { id } });
};

export const projectMilestoneService = {
	createMilestoneInDB,
	getAllMilestonesFromDB,
	getMilestoneByIdFromDB,
	updateMilestoneInDB,
	updateMilestoneStatusInDB,
	deleteMilestoneFromDB,
};
