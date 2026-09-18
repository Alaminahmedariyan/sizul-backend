import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import type { ProjectFile } from "../../../generated/prisma/client";
import { projectFileQueryConfig } from "./projectFile.constant";
import type { FileCategory } from "./projectFile.interface";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../../utils/fileUploader";


const fileDelegate = prisma.projectFile as unknown as PrismaDelegate<ProjectFile>;

const resolveFileCategory = (mimeType: string): FileCategory => {
	if (mimeType.startsWith("image/")) return "IMAGE";
	if (mimeType.startsWith("video/")) return "VIDEO";
	if (mimeType.startsWith("audio/")) return "AUDIO";
	if (
		mimeType === "application/pdf" ||
		mimeType.includes("word") ||
		mimeType === "text/plain" ||
		mimeType === "text/csv"
	) {
		return "DOCUMENT";
	}
	return "OTHER";
};

const assertProjectExists = async (projectId: string) => {
	const project = await prisma.project.findUnique({ where: { id: projectId } });
	if (!project) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided projectId does not match any project.");
	}
};

const uploadProjectFileInDB = async (
	projectId: string,
	file: Express.Multer.File,
	description?: string,
) => {
	await assertProjectExists(projectId);

	const uploadResult = await uploadFileToCloudinary(file.buffer, file.originalname, `projects/${projectId}`);

	return prisma.projectFile.create({
		data: {
			projectId,
			fileName: file.originalname,
			fileUrl: uploadResult.secure_url,
			publicId: uploadResult.public_id,
			mimeType: file.mimetype,
			size: file.size,
			category: resolveFileCategory(file.mimetype),
			...(description !== undefined && { description }),
		},
	});
};

export const getAllProjectFilesFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<ProjectFile>(fileDelegate, projectFileQueryConfig);
	return queryBuilder.execute(query);
};

export const getProjectFileByIdFromDB = async (id: string) => {
	const file = await prisma.projectFile.findUnique({ where: { id }, include: { project: true } });
	if (!file) {
		throw new AppError(StatusCodes.NOT_FOUND, "File not found.");
	}
	return file;
};

export const deleteProjectFileFromDB = async (id: string) => {
	const existing = await prisma.projectFile.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "File not found.");
	}

	if (existing.publicId) {
		try {
			await deleteFileFromCloudinary(existing.publicId);
		} catch (error) {
			// Don't block deleting the DB record over a Cloudinary hiccup — log and
			// continue. Worst case is an orphaned asset, not a stuck UI.
			console.error("[ProjectFile] Failed to delete Cloudinary asset:", error);
		}
	}

	await prisma.projectFile.delete({ where: { id } });
};

export const projectFileService = {
	uploadProjectFileInDB,
	getAllProjectFilesFromDB,
	getProjectFileByIdFromDB,
	deleteProjectFileFromDB,
};
