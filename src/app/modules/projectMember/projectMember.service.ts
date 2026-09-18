import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { ProjectMember } from "../../../generated/prisma/client";
import { projectMemberQueryConfig } from "./projectMember.constant";

type ProjectMemberRole = "LEAD" | "MEMBER" | "REVIEWER" | "OBSERVER";

const projectMemberDelegate = prisma.projectMember as unknown as PrismaDelegate<ProjectMember>;

 const addProjectMemberInDB = async (payload: { projectId: string; staffId: string; role: ProjectMemberRole }) => {
	const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
	if (!project) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided projectId does not match any project.");
	}

	const staff = await prisma.staff.findUnique({ where: { id: payload.staffId } });
	if (!staff) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided staffId does not match any staff member.");
	}

	const existing = await prisma.projectMember.findUnique({
		where: { projectId_staffId: { projectId: payload.projectId, staffId: payload.staffId } },
	});
	if (existing) {
		throw new AppError(StatusCodes.CONFLICT, "This staff member is already on the project.");
	}

	return prisma.projectMember.create({ data: payload as Prisma.ProjectMemberUncheckedCreateInput });
};

 const getAllProjectMembersFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<ProjectMember>(projectMemberDelegate, projectMemberQueryConfig);
	return queryBuilder.execute(query);
};

 const getProjectMemberByIdFromDB = async (id: string) => {
	const member = await prisma.projectMember.findUnique({ where: { id }, include: { project: true, staff: true } });
	if (!member) {
		throw new AppError(StatusCodes.NOT_FOUND, "Project member not found.");
	}
	return member;
};

 const updateProjectMemberRoleInDB = async (id: string, role: ProjectMemberRole) => {
	const existing = await prisma.projectMember.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Project member not found.");
	}

	return prisma.projectMember.update({ where: { id }, data: { role } });
};

 const removeProjectMemberFromDB = async (id: string) => {
	const existing = await prisma.projectMember.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Project member not found.");
	}

	await prisma.projectMember.delete({ where: { id } });
};

export const projectMemberService = {
	addProjectMemberInDB,
	getAllProjectMembersFromDB,
	getProjectMemberByIdFromDB,
	updateProjectMemberRoleInDB,
	removeProjectMemberFromDB,
};