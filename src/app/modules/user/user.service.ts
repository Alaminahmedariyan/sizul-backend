import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import type { User } from "../../../generated/prisma/client";
import { userQueryConfig } from "./user.constant";

type UpdateUserRoleInput = "ADMIN" | "STAFF" | "CLIENT";
type UpdateUserStatusInput = "ACTIVE" | "INACTIVE" | "SUSPENDED";
type UpdateMyProfileInput = { name?: string; image?: string };

const omitPassword = (user: User) => {
	const { passwordHash: _passwordHash, ...rest } = user;
	return rest;
};

const userDelegate = prisma.user as unknown as PrismaDelegate<User>;

export const getAllUsersFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<User>(userDelegate, userQueryConfig);
	const { data, meta } = await queryBuilder.execute(query);

	return { data: data.map(omitPassword), meta };
};

export const getUserByIdFromDB = async (id: string) => {
	if (!id) {
		throw new AppError(StatusCodes.BAD_REQUEST, "User id is required.");
	}

	const user = await prisma.user.findUnique({
		where: { id },
		include: { staffProfile: true, clientProfile: true },
	});

	if (!user) {
		throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
	}

	return omitPassword(user);
};

export const updateUserRoleInDB = async (id: string, role: UpdateUserRoleInput) => {
	const existing = await prisma.user.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
	}

	if (existing.role === role) {
		throw new AppError(StatusCodes.BAD_REQUEST, `User already has role ${role}.`);
	}

	const updated = await prisma.user.update({ where: { id }, data: { role } });
	return omitPassword(updated);
};

export const updateUserStatusInDB = async (id: string, status: UpdateUserStatusInput) => {
	const existing = await prisma.user.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
	}

	if (existing.status === status) {
		throw new AppError(StatusCodes.BAD_REQUEST, `User already has status ${status}.`);
	}

	const updated = await prisma.user.update({ where: { id }, data: { status } });
	return omitPassword(updated);
};

export const updateMyProfileInDB = async (id: string, payload: UpdateMyProfileInput) => {
	if (!id) {
		throw new AppError(StatusCodes.UNAUTHORIZED, "Authentication required.");
	}

	const existing = await prisma.user.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
	}

	// Guard against empty payload — nothing to update
	const data: UpdateMyProfileInput = {};
	if (payload.name !== undefined) data.name = payload.name;
	if (payload.image !== undefined) data.image = payload.image;

	if (Object.keys(data).length === 0) {
		throw new AppError(StatusCodes.BAD_REQUEST, "No fields to update.");
	}

	const updated = await prisma.user.update({ where: { id }, data });
	return omitPassword(updated);
};