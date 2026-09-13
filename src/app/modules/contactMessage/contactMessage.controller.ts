import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as messageService from "./contactMessage.service";

export const createContactMessage = catchAsync(async (req: Request, res: Response) => {
	const message = await messageService.createContactMessageInDB(req.body);
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Thank you for reaching out! We'll get back to you soon.",
		data: message,
	});
});

export const getAllContactMessages = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await messageService.getAllContactMessagesFromDB(req.query as Record<string, unknown>);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Messages retrieved successfully.", data, meta });
});

export const getContactMessageById = catchAsync(async (req: Request, res: Response) => {
	const message = await messageService.getContactMessageByIdFromDB(req.params.id as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Message retrieved successfully.", data: message });
});

export const updateContactMessageStatus = catchAsync(async (req: Request, res: Response) => {
	const message = await messageService.updateContactMessageStatusInDB(req.params.id as string, req.body.status);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Message status updated successfully.", data: message });
});

export const deleteContactMessage = catchAsync(async (req: Request, res: Response) => {
	await messageService.deleteContactMessageFromDB(req.params.id as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Message deleted successfully.", data: null });
});