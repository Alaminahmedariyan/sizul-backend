import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as milestoneService from "./projectMilestone.service";

export const createMilestone = catchAsync(async (req: Request, res: Response) => {
	const milestone = await milestoneService.createMilestoneInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Milestone created successfully.",
		data: milestone,
	});
});

export const getAllMilestones = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await milestoneService.getAllMilestonesFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Milestones retrieved successfully.",
		data,
		meta,
	});
});

export const getMilestoneById = catchAsync(async (req: Request, res: Response) => {
	const milestone = await milestoneService.getMilestoneByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Milestone retrieved successfully.",
		data: milestone,
	});
});

export const updateMilestone = catchAsync(async (req: Request, res: Response) => {
	const milestone = await milestoneService.updateMilestoneInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Milestone updated successfully.",
		data: milestone,
	});
});

export const updateMilestoneStatus = catchAsync(async (req: Request, res: Response) => {
	const milestone = await milestoneService.updateMilestoneStatusInDB(req.params.id as string, req.body.status);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Milestone status updated successfully.",
		data: milestone,
	});
});

export const deleteMilestone = catchAsync(async (req: Request, res: Response) => {
	await milestoneService.deleteMilestoneFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Milestone deleted successfully.",
		data: null,
	});
});
