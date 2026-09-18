import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Media } from "../../../generated/prisma/client";
// ADJUST THIS PATH if your Cloudinary upload util lives somewhere else (see the
// note on this same import in projectFile.service.ts):
import { mediaQueryConfig } from "./media.constant";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../../utils/fileUploader";

type FileCategory = "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "OTHER";

const mediaDelegate = prisma.media as unknown as PrismaDelegate<Media>;

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

 const uploadMediaInDB = async (file: Express.Multer.File, altText?: string, caption?: string) => {
	const uploadResult = await uploadFileToCloudinary(file.buffer, file.originalname, "media-library");

	return prisma.media.create({
		data: {
			fileName: file.originalname,
			url: uploadResult.secure_url,
			publicId: uploadResult.public_id,
			mimeType: file.mimetype,
			size: file.size,
			category: resolveFileCategory(file.mimetype),
			width: uploadResult.width ?? null,
			height: uploadResult.height ?? null,
			...(altText !== undefined && { altText }),
			...(caption !== undefined && { caption }),
		},
	});
};

 const getAllMediaFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<Media>(mediaDelegate, mediaQueryConfig);
	return queryBuilder.execute(query);
};

 const getMediaByIdFromDB = async (id: string) => {
	const media = await prisma.media.findUnique({ where: { id } });
	if (!media) {
		throw new AppError(StatusCodes.NOT_FOUND, "Media not found.");
	}
	return media;
};

 const updateMediaInDB = async (id: string, payload: { altText?: string | null; caption?: string | null }) => {
	const existing = await prisma.media.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Media not found.");
	}
	return prisma.media.update({ where: { id }, data: payload as Prisma.MediaUncheckedUpdateInput });
};

 const deleteMediaFromDB = async (id: string) => {
	const existing = await prisma.media.findUnique({ where: { id } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Media not found.");
	}

	if (existing.publicId) {
		try {
			await deleteFileFromCloudinary(existing.publicId);
		} catch (error) {
			console.error("[Media] Failed to delete Cloudinary asset:", error);
		}
	}

	await prisma.media.delete({ where: { id } });
};

export const mediaService = {
	uploadMediaInDB,
	getAllMediaFromDB,
	getMediaByIdFromDB,
	updateMediaInDB,
	deleteMediaFromDB,
};
