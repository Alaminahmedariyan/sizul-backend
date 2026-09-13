import { StatusCodes } from "http-status-codes";
import type { UploadApiResponse } from "cloudinary";

import { cloudinary } from "../../lib/cloudinary";
import AppError from "../errors/appError";

export const uploadFileToCloudinary = async (
	buffer: Buffer,
	fileName: string,
	folder = "uploads",
): Promise<UploadApiResponse> => {
	if (!buffer || !fileName) {
		throw new AppError(StatusCodes.BAD_REQUEST, "File buffer or file name is missing.");
	}

	const fileNameWithoutExtension = fileName
		.split(".")
		.slice(0, -1)
		.join(".")
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");

	const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${fileNameWithoutExtension}`;

	return new Promise((resolve, reject) => {
		cloudinary.uploader
			.upload_stream({ folder, public_id: uniqueName, resource_type: "auto" }, (error, result) => {
				if (error || !result) {
					return reject(new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Cloudinary upload failed."));
				}
				resolve(result);
			})
			.end(buffer);
	});
};

export const deleteFileFromCloudinary = async (publicId: string) => {
	await cloudinary.uploader.destroy(publicId);
};