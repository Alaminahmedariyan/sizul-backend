import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { prisma } from "../../../lib/prisma";

export const assertProjectExists = async (projectId: string) => {
	const project = await prisma.project.findUnique({ where: { id: projectId } });
	if (!project) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided projectId does not match any project.");
	}
};