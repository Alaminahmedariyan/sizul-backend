import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import type { Staff } from "../../../generated/prisma/client";
import { staffQueryConfig } from "./staff.constant";

type CreateStaffInput = {
	userId?: string;
	employeeId?: string;
	fullName: string;
	email: string;
	phone?: string;
	role?: "OWNER" | "MANAGER" | "DEVELOPER" | "DESIGNER" | "MARKETING" | "SALES" | "SUPPORT";
	designation?: string;
	department?: string;
	bio?: string;
	avatar?: string;
	hireDate?: Date;
};

type UpdateStaffInput = {
	userId?: string | null;
	employeeId?: string | null;
	fullName?: string;
	email?: string;
	phone?: string | null;
	role?: "OWNER" | "MANAGER" | "DEVELOPER" | "DESIGNER" | "MARKETING" | "SALES" | "SUPPORT";
	designation?: string | null;
	department?: string | null;
	bio?: string | null;
	avatar?: string | null;
	hireDate?: Date | null;
};
type StaffStatusInput = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";

const staffDelegate = prisma.staff as unknown as PrismaDelegate<Staff>;

const assertUserExistsAndUnlinked = async (userId: string, excludeStaffId?: string) => {
	const user = await prisma.user.findUnique({ where: { id: userId }, include: { staffProfile: true } });
	if (!user) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided userId does not match any user.");
	}
	if (user.staffProfile && user.staffProfile.id !== excludeStaffId) {
		throw new AppError(StatusCodes.CONFLICT, "This user is already linked to another staff profile.");
	}
};

export const createStaffInDB = async (payload: CreateStaffInput) => {
	if (payload.userId) {
		await assertUserExistsAndUnlinked(payload.userId);
	}

	return prisma.staff.create({ data: payload });
};

export const getAllStaffFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<Staff>(staffDelegate, staffQueryConfig);
	return queryBuilder.execute(query);
};

export const getStaffByIdFromDB = async (id: string) => {
	const staff = await prisma.staff.findUnique({
		where: { id },
		include: { user: { select: { id: true, email: true, name: true, image: true } } },
	});

	if (!staff) {
		throw new AppError(StatusCodes.NOT_FOUND, "Staff member not found.");
	}

	return staff;
};

export const updateStaffInDB = async (id: string, payload: UpdateStaffInput) => {
	const existing = await prisma.staff.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Staff member not found.");
	}

	if (payload.userId) {
		await assertUserExistsAndUnlinked(payload.userId, id);
	}

	return prisma.staff.update({ where: { id }, data: payload });
};

export const updateStaffStatusInDB = async (id: string, status: StaffStatusInput) => {
	const existing = await prisma.staff.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Staff member not found.");
	}

	return prisma.staff.update({ where: { id }, data: { status } });
};

export const deleteStaffFromDB = async (id: string) => {
	const existing = await prisma.staff.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Staff member not found.");
	}

	await prisma.staff.delete({ where: { id } });
};
