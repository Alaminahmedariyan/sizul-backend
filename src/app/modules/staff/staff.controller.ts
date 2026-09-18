import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { staffService } from "./staff.service";


 const createStaff = catchAsync(async (req: Request, res: Response) => {
	const staff = await staffService.createStaffInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Staff member created successfully.",
		data: staff,
	});
});

 const getAllStaff = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await staffService.getAllStaffFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Staff members retrieved successfully.",
		data,
		meta,
	});
});

 const getStaffById = catchAsync(async (req: Request, res: Response) => {
	const staff = await staffService.getStaffByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Staff member retrieved successfully.",
		data: staff,
	});
});

 const updateStaff = catchAsync(async (req: Request, res: Response) => {
	const staff = await staffService.updateStaffInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Staff member updated successfully.",
		data: staff,
	});
});

 const updateStaffStatus = catchAsync(async (req: Request, res: Response) => {
	const staff = await staffService.updateStaffStatusInDB(req.params.id as string, req.body.status);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Staff status updated successfully.",
		data: staff,
	});
});

 const deleteStaff = catchAsync(async (req: Request, res: Response) => {
	await staffService.deleteStaffFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Staff member deleted successfully.",
		data: null,
	});
});

export const staffController = {
	createStaff,
	getAllStaff,
	getStaffById,
	updateStaff,
	updateStaffStatus,
	deleteStaff,
};