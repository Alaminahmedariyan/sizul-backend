import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { User } from "../../../generated/prisma/client";
import { userQueryConfig } from "./user.constant";

type UpdateUserRoleInput = "ADMIN" | "STAFF" | "CLIENT";
type UpdateUserStatusInput = "ACTIVE" | "INACTIVE" | "SUSPENDED";
type UpdateMyProfileInput = { name?: string; image?: string };

const omitPassword = (user: User) => {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
};

// Prisma's generated delegate type is more specific than the generic
// PrismaDelegate<T> the QueryBuilder expects (extra optional args, branded
// where-input types), so a structural cast is needed here. This is safe:
// QueryBuilder only ever calls findMany/count with the args it built itself.
const userDelegate = prisma.user as unknown as PrismaDelegate<User>;

const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder<User>(userDelegate, userQueryConfig);
  const { data, meta } = await queryBuilder.execute(query);

  return { data: data.map(omitPassword), meta };
};

const getUserByIdFromDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { staffProfile: true, clientProfile: true },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  return omitPassword(user);
};

const updateUserRoleInDB = async (id: string, role: UpdateUserRoleInput) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  const updated = await prisma.user.update({ where: { id }, data: { role } });
  return omitPassword(updated);
};

const updateUserStatusInDB = async (
  id: string,
  status: UpdateUserStatusInput,
) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  const updated = await prisma.user.update({ where: { id }, data: { status } });
  return omitPassword(updated);
};

const updateMyProfileInDB = async (
  id: string,
  payload: UpdateMyProfileInput,
) => {
  const updated = await prisma.user.update({
    where: { id },
    data: payload as Prisma.UserUncheckedUpdateInput,
  });
  return omitPassword(updated);
};

export const userService = {
  getAllUsersFromDB,
  getUserByIdFromDB,
  updateUserRoleInDB,
  updateUserStatusInDB,
  updateMyProfileInDB,
};
