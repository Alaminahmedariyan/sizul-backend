import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Project } from "../../../generated/prisma/client";
import { projectQueryConfig } from "./project.constant";
import type {
  ProjectStatus,
  CreateProjectInput,
  UpdateProjectInput,
} from "./project.interface";

const projectDelegate = prisma.project as unknown as PrismaDelegate<Project>;

const assertClientExists = async (clientId: string) => {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "The provided clientId does not match any client.",
    );
  }
};

const assertProjectExists = async (id: string) => {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found.");
  }
  return project;
};

const toPrismaData = <T extends { budget?: number | null }>(payload: T) => ({
  ...payload,
  ...(payload.budget !== undefined && {
    budget: payload.budget === null ? null : new Prisma.Decimal(payload.budget),
  }),
});

const createProjectInDB = async (payload: CreateProjectInput) => {
  if (payload.clientId) {
    await assertClientExists(payload.clientId);
  }

  return prisma.project.create({
    data: toPrismaData(payload) as Prisma.ProjectUncheckedCreateInput,
  });
};

export const getAllProjectsFromDB = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder<Project>(
    projectDelegate,
    projectQueryConfig,
  );
  return queryBuilder.execute(query);
};

export const getProjectByIdFromDB = async (id: string) => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      members: { include: { staff: true } },
      milestones: { orderBy: { order: "asc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      files: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found.");
  }

  return project;
};

const updateProjectInDB = async (
  id: string,
  payload: UpdateProjectInput,
) => {
  await assertProjectExists(id);

  if (payload.clientId) {
    await assertClientExists(payload.clientId);
  }

  return prisma.project.update({
    where: { id },
    data: toPrismaData(payload) as Prisma.ProjectUncheckedUpdateInput,
  });
};

const updateProjectStatusInDB = async (
  id: string,
  status: ProjectStatus,
) => {
  const existing = await assertProjectExists(id);

  // Keep completedAt consistent with status: stamp it on entering COMPLETED,
  // clear it if the project is moved back out of COMPLETED.
  const completedAt =
    status === "COMPLETED"
      ? new Date()
      : existing.status === "COMPLETED"
        ? null
        : existing.completedAt;

  return prisma.project.update({
    where: { id },
    data: { status, completedAt },
  });
};

const updateProjectProgressInDB = async (
  id: string,
  progress: number,
) => {
  await assertProjectExists(id);
  return prisma.project.update({ where: { id }, data: { progress } });
};

export const deleteProjectFromDB = async (id: string) => {
  await assertProjectExists(id);
  await prisma.project.delete({ where: { id } });
};

export const projectService = {
  createProjectInDB,
  getAllProjectsFromDB,
  getProjectByIdFromDB,
  updateProjectInDB,
  updateProjectStatusInDB,
  updateProjectProgressInDB,
  deleteProjectFromDB,
};
