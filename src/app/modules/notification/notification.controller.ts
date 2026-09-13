import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as notificationService from "./notification.service";

export const createNotification = catchAsync(async (req: Request, res: Response) => {
	const notification = await notificationService.createNotificationInDB(req.body);
	sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Notification created successfully.", data: notification });
});

export const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await notificationService.getMyNotificationsFromDB(req.user?.id ?? "", req.query as Record<string, unknown>);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Notifications retrieved successfully.", data, meta });
});

export const markNotificationRead = catchAsync(async (req: Request, res: Response) => {
	const notification = await notificationService.markNotificationReadInDB(req.params.id as string, req.user?.id ?? "");
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Notification marked as read.", data: notification });
});

export const markAllNotificationsRead = catchAsync(async (req: Request, res: Response) => {
	await notificationService.markAllNotificationsReadInDB(req.user?.id ?? "");
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "All notifications marked as read.", data: null });
});

export const deleteMyNotification = catchAsync(async (req: Request, res: Response) => {
	await notificationService.deleteMyNotificationFromDB(req.params.id as string, req.user?.id ?? "");
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Notification deleted successfully.", data: null });
});