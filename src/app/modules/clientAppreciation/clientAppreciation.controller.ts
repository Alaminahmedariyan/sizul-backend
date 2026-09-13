import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as appreciationService from "./clientAppreciation.service";

export const createAppreciation = catchAsync(async (req: Request, res: Response) => {
	const appreciation = await appreciationService.createAppreciationInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Appreciation record created successfully.",
		data: appreciation,
	});
});

export const getAllAppreciations = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await appreciationService.getAllAppreciationsFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Appreciation records retrieved successfully.",
		data,
		meta,
	});
});

export const getAppreciationById = catchAsync(async (req: Request, res: Response) => {
	const appreciation = await appreciationService.getAppreciationByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Appreciation record retrieved successfully.",
		data: appreciation,
	});
});

export const updateAppreciation = catchAsync(async (req: Request, res: Response) => {
	const appreciation = await appreciationService.updateAppreciationInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Appreciation record updated successfully.",
		data: appreciation,
	});
});

export const deleteAppreciation = catchAsync(async (req: Request, res: Response) => {
	await appreciationService.deleteAppreciationFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Appreciation record deleted successfully.",
		data: null,
	});
});
