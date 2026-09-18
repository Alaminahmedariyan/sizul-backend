import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Client } from "../../../generated/prisma/client";
import { clientQueryConfig } from "./client.constant";
import type {
  CreateClientInput,
  UpdateClientInput,
  UpdateMyClientProfileInput,
} from "./client.interface";

const clientDelegate = prisma.client as unknown as PrismaDelegate<Client>;

const assertUserExistsAndUnlinked = async (
  userId: string,
  excludeClientId?: string,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { clientProfile: true },
  });
  if (!user) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "The provided userId does not match any user.",
    );
  }
  if (user.clientProfile && user.clientProfile.id !== excludeClientId) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "This user is already linked to another client profile.",
    );
  }
};

const createClientInDB = async (payload: CreateClientInput) => {
  if (payload.userId) {
    await assertUserExistsAndUnlinked(payload.userId);
  }

  return prisma.client.create({
    data: payload as Prisma.ClientUncheckedCreateInput,
  });
};

export const getAllClientsFromDB = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder<Client>(
    clientDelegate,
    clientQueryConfig,
  );
  return queryBuilder.execute(query);
};

export const getClientByIdFromDB = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, image: true } },
    },
  });

  if (!client) {
    throw new AppError(StatusCodes.NOT_FOUND, "Client not found.");
  }

  return client;
};

export const getMyClientProfileFromDB = async (userId: string) => {
  const client = await prisma.client.findUnique({ where: { userId } });

  if (!client) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "No client profile is linked to your account.",
    );
  }

  return client;
};

const updateClientInDB = async (
  id: string,
  payload: UpdateClientInput,
) => {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Client not found.");
  }

  if (payload.userId) {
    await assertUserExistsAndUnlinked(payload.userId, id);
  }

  return prisma.client.update({
    where: { id },
    data: payload as Prisma.ClientUncheckedUpdateInput,
  });
};

const updateMyClientProfileInDB = async (
  userId: string,
  payload: UpdateMyClientProfileInput,
) => {
  const existing = await prisma.client.findUnique({ where: { userId } });
  if (!existing) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "No client profile is linked to your account.",
    );
  }

  return prisma.client.update({
    where: { userId },
    data: payload as Prisma.ClientUncheckedUpdateInput,
  });
};

const updateClientActiveInDB = async (id: string, isActive: boolean) => {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Client not found.");
  }

  return prisma.client.update({ where: { id }, data: { isActive } });
};

export const deleteClientFromDB = async (id: string) => {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Client not found.");
  }

  await prisma.client.delete({ where: { id } });
};

export const clientService = {
  createClientInDB,
  getAllClientsFromDB,
  getClientByIdFromDB,
  getMyClientProfileFromDB,
  updateClientInDB,
  updateMyClientProfileInDB,
  updateClientActiveInDB,
  deleteClientFromDB,
};
