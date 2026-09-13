import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as tagService from "./blogTag.service";

export const createBlogTag = catchAsync(async (req: Request, res: Response) => {
	const tag = await tagService.createBlogTagInDB(req.body);
	sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Tag created successfully.", data: tag });
});

export const getAllBlogTags = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await tagService.getAllBlogTagsFromDB(req.query as Record<string, unknown>);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Tags retrieved successfully.", data, meta });
});

export const getBlogTagById = catchAsync(async (req: Request, res: Response) => {
	const tag = await tagService.getBlogTagByIdFromDB(req.params.id as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Tag retrieved successfully.", data: tag });
});

export const updateBlogTag = catchAsync(async (req: Request, res: Response) => {
	const tag = await tagService.updateBlogTagInDB(req.params.id as string, req.body);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Tag updated successfully.", data: tag });
});

export const deleteBlogTag = catchAsync(async (req: Request, res: Response) => {
	await tagService.deleteBlogTagFromDB(req.params.id as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Tag deleted successfully.", data: null });
});
