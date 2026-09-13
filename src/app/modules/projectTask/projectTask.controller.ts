import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as taskService from "./projectTask.service";

export const createTask = catchAsync(async (req: Request, res: Response) => {
	const task = await taskService.createTaskInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Task created successfully.",
		data: task,
	});
});

export const getAllTasks = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await taskService.getAllTasksFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Tasks retrieved successfully.",
		data,
		meta,
	});
});

export const getTaskById = catchAsync(async (req: Request, res: Response) => {
	const task = await taskService.getTaskByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Task retrieved successfully.",
		data: task,
	});
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
	const task = await taskService.updateTaskInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Task updated successfully.",
		data: task,
	});
});

export const updateTaskStatus = catchAsync(async (req: Request, res: Response) => {
	const task = await taskService.updateTaskStatusInDB(req.params.id as string, req.body.status);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Task status updated successfully.",
		data: task,
	});
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
	await taskService.deleteTaskFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Task deleted successfully.",
		data: null,
	});
});
