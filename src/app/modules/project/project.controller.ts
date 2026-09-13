import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as projectService from "./project.service";

export const createProject = catchAsync(async (req: Request, res: Response) => {
	const project = await projectService.createProjectInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Project created successfully.",
		data: project,
	});
});

export const getAllProjects = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await projectService.getAllProjectsFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Projects retrieved successfully.",
		data,
		meta,
	});
});

export const getProjectById = catchAsync(async (req: Request, res: Response) => {
	const project = await projectService.getProjectByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Project retrieved successfully.",
		data: project,
	});
});

export const updateProject = catchAsync(async (req: Request, res: Response) => {
	const project = await projectService.updateProjectInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Project updated successfully.",
		data: project,
	});
});

export const updateProjectStatus = catchAsync(async (req: Request, res: Response) => {
	const project = await projectService.updateProjectStatusInDB(req.params.id as string, req.body.status);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Project status updated successfully.",
		data: project,
	});
});

export const updateProjectProgress = catchAsync(async (req: Request, res: Response) => {
	const project = await projectService.updateProjectProgressInDB(req.params.id as string, req.body.progress);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Project progress updated successfully.",
		data: project,
	});
});

export const deleteProject = catchAsync(async (req: Request, res: Response) => {
	await projectService.deleteProjectFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Project deleted successfully.",
		data: null,
	});
});
