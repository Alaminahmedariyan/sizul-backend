import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { projectTaskService } from "./projectTask.service";

 const createTask = catchAsync(async (req: Request, res: Response) => {
	const task = await projectTaskService.createTaskInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Task created successfully.",
		data: task,
	});
});

 const getAllTasks = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await projectTaskService.getAllTasksFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Tasks retrieved successfully.",
		data,
		meta,
	});
});

 const getTaskById = catchAsync(async (req: Request, res: Response) => {
	const task = await projectTaskService.getTaskByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Task retrieved successfully.",
		data: task,
	});
});

 const updateTask = catchAsync(async (req: Request, res: Response) => {
	const task = await projectTaskService.updateTaskInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Task updated successfully.",
		data: task,
	});
});

 const updateTaskStatus = catchAsync(async (req: Request, res: Response) => {
	const task = await projectTaskService.updateTaskStatusInDB(req.params.id as string, req.body.status);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Task status updated successfully.",
		data: task,
	});
});

 const deleteTask = catchAsync(async (req: Request, res: Response) => {
	await projectTaskService.deleteTaskFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Task deleted successfully.",
		data: null,
	});
});


export const projectTaskController = {
	createTask,
	getAllTasks,
	getTaskById,
	updateTask,
	updateTaskStatus,
	deleteTask,
};
