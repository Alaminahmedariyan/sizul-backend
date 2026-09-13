import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as settingService from "./siteSetting.service";

export const upsertSiteSetting = catchAsync(async (req: Request, res: Response) => {
	const setting = await settingService.upsertSiteSettingInDB(req.body);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Setting saved successfully.", data: setting });
});

export const getAllSiteSettings = catchAsync(async (_req: Request, res: Response) => {
	const settings = await settingService.getAllSiteSettingsFromDB();
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Settings retrieved successfully.", data: settings });
});

export const getSiteSettingByKey = catchAsync(async (req: Request, res: Response) => {
	const setting = await settingService.getSiteSettingByKeyFromDB(req.params.key as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Setting retrieved successfully.", data: setting });
});

export const deleteSiteSetting = catchAsync(async (req: Request, res: Response) => {
	await settingService.deleteSiteSettingFromDB(req.params.key as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Setting deleted successfully.", data: null });
});