import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { siteSettingService } from "./siteSetting.service";

const upsertSiteSetting = catchAsync(async (req: Request, res: Response) => {
  const setting = await siteSettingService.upsertSiteSettingInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Setting saved successfully.",
    data: setting,
  });
});

const getAllSiteSettings = catchAsync(async (_req: Request, res: Response) => {
  const settings = await siteSettingService.getAllSiteSettingsFromDB();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Settings retrieved successfully.",
    data: settings,
  });
});

const getSiteSettingByKey = catchAsync(async (req: Request, res: Response) => {
  const setting = await siteSettingService.getSiteSettingByKeyFromDB(
    req.params.key as string,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Setting retrieved successfully.",
    data: setting,
  });
});

const deleteSiteSetting = catchAsync(async (req: Request, res: Response) => {
  await siteSettingService.deleteSiteSettingFromDB(req.params.key as string);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Setting deleted successfully.",
    data: null,
  });
});

export const siteSettingController = {
	upsertSiteSetting,
	getAllSiteSettings,
	getSiteSettingByKey,
	deleteSiteSetting,
};