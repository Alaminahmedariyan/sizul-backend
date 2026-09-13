import { StatusCodes } from "http-status-codes";
import multer from "multer";

import AppError from "../errors/appError";

const storage = multer.memoryStorage();

const IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const DOCUMENT_MIME_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"text/plain",
	"text/csv",
];

const makeUploader = (allowedMimeTypes: string[], maxSizeBytes: number, label: string) =>
	multer({
		storage,
		limits: { fileSize: maxSizeBytes },
		fileFilter: (_req, file, cb) => {
			if (!allowedMimeTypes.includes(file.mimetype)) {
				return cb(new AppError(StatusCodes.BAD_REQUEST, `This file type is not allowed for ${label}.`));
			}
			cb(null, true);
		},
	});

export const imageUpload = makeUploader(IMAGE_MIME_TYPES, 5 * 1024 * 1024, "images");
export const documentUpload = makeUploader([...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES], 20 * 1024 * 1024, "documents");