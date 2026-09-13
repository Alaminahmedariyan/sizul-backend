import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as projectMemberService from "./projectMember.service";

export const addProjectMember = catchAsync(async (req: Request, res: Response) => {
	const member = await projectMemberService.addProjectMemberInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Member added to project successfully.",
		data: member,
	});
});

export const getAllProjectMembers = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await projectMemberService.getAllProjectMembersFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Project members retrieved successfully.",
		data,
		meta,
	});
});

export const getProjectMemberById = catchAsync(async (req: Request, res: Response) => {
	const member = await projectMemberService.getProjectMemberByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Project member retrieved successfully.",
		data: member,
	});
});

export const updateProjectMemberRole = catchAsync(async (req: Request, res: Response) => {
	const member = await projectMemberService.updateProjectMemberRoleInDB(req.params.id as string, req.body.role);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Project member role updated successfully.",
		data: member,
	});
});

export const removeProjectMember = catchAsync(async (req: Request, res: Response) => {
	await projectMemberService.removeProjectMemberFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Member removed from project successfully.",
		data: null,
	});
});
