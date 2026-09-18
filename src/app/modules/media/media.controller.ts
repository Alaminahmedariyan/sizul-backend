import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import AppError from "../../errors/appError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { mediaService } from "./media.service";

 const uploadMedia = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A file is required (field name: 'file').",
    );
  }

  const media = await mediaService.uploadMediaInDB(
    req.file,
    req.body.altText,
    req.body.caption,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Media uploaded successfully.",
    data: media,
  });
});

 const getAllMedia = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await mediaService.getAllMediaFromDB(
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Media retrieved successfully.",
    data,
    meta,
  });
});

 const getMediaById = catchAsync(async (req: Request, res: Response) => {
  const media = await mediaService.getMediaByIdFromDB(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Media retrieved successfully.",
    data: media,
  });
});

 const updateMedia = catchAsync(async (req: Request, res: Response) => {
  const media = await mediaService.updateMediaInDB(
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Media updated successfully.",
    data: media,
  });
});

 const deleteMedia = catchAsync(async (req: Request, res: Response) => {
  await mediaService.deleteMediaFromDB(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Media deleted successfully.",
    data: null,
  });
});

export const mediaController = {
	uploadMedia,
	getAllMedia,
	getMediaById,
	updateMedia,
	deleteMedia,
};