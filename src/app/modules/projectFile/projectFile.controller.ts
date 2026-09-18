import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import AppError from "../../errors/appError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { projectFileService } from "./projectFile.service";

 const uploadProjectFile = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new AppError(StatusCodes.BAD_REQUEST, "A file is required (field name: 'file').");
	}

	const file = await projectFileService.uploadProjectFileInDB(req.body.projectId, req.file, req.body.description);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "File uploaded successfully.",
		data: file,
	});
});

 const getAllProjectFiles = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await projectFileService.getAllProjectFilesFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Files retrieved successfully.",
		data,
		meta,
	});
});

 const getProjectFileById = catchAsync(async (req: Request, res: Response) => {
	const file = await projectFileService.getProjectFileByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "File retrieved successfully.",
		data: file,
	});
});

 const deleteProjectFile = catchAsync(async (req: Request, res: Response) => {
	await projectFileService.deleteProjectFileFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "File deleted successfully.",
		data: null,
	});
});


export const projectFileController = {
	uploadProjectFile,
	getAllProjectFiles,
	getProjectFileById,
	deleteProjectFile,
};