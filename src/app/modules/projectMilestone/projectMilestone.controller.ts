import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { projectMilestoneService } from "./projectMilestone.service";

 const createMilestone = catchAsync(async (req: Request, res: Response) => {
	const milestone = await projectMilestoneService.createMilestoneInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Milestone created successfully.",
		data: milestone,
	});
});

 const getAllMilestones = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await  projectMilestoneService.getAllMilestonesFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Milestones retrieved successfully.",
		data,
		meta,
	});
});

 const getMilestoneById = catchAsync(async (req: Request, res: Response) => {
	const milestone = await  projectMilestoneService.getMilestoneByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Milestone retrieved successfully.",
		data: milestone,
	});
});

 const updateMilestone = catchAsync(async (req: Request, res: Response) => {
	const milestone = await  projectMilestoneService.updateMilestoneInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Milestone updated successfully.",
		data: milestone,
	});
});

 const updateMilestoneStatus = catchAsync(async (req: Request, res: Response) => {
	const milestone = await  projectMilestoneService.updateMilestoneStatusInDB(req.params.id as string, req.body.status);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Milestone status updated successfully.",
		data: milestone,
	});
});

 const deleteMilestone = catchAsync(async (req: Request, res: Response) => {
	await  projectMilestoneService.deleteMilestoneFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Milestone deleted successfully.",
		data: null,
	});
});

export const projectMilestoneController = {
	createMilestone,
	getAllMilestones,
	getMilestoneById,
	updateMilestone,
	updateMilestoneStatus,
	deleteMilestone,
};