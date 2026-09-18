import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { userService } from "./user.service";


 const getAllUsers = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await userService.getAllUsersFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Users retrieved successfully.",
		data,
		meta,
	});
});

 const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = await userService.getUserByIdFromDB(req.user?.id ?? "");

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Profile retrieved successfully.",
		data: user,
	});
});

 const updateMe = catchAsync(async (req: Request, res: Response) => {
	const user = await userService.updateMyProfileInDB(req.user?.id ?? "", req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Profile updated successfully.",
		data: user,
	});
});

 const getUserById = catchAsync(async (req: Request, res: Response) => {
	const user = await userService.getUserByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "User retrieved successfully.",
		data: user,
	});
});

 const updateUserRole = catchAsync(async (req: Request, res: Response) => {
	const user = await userService.updateUserRoleInDB(req.params.id as string, req.body.role);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "User role updated successfully.",
		data: user,
	});
});

 const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
	const user = await userService.updateUserStatusInDB(req.params.id as string, req.body.status);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "User status updated successfully.",
		data: user,
	});
});

export const userController = {
	getAllUsers,
	getMe,
	updateMe,
	getUserById,
	updateUserRole,
	updateUserStatus,
};