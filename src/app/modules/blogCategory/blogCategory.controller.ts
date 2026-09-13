import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as categoryService from "./blogCategory.service";

export const createBlogCategory = catchAsync(async (req: Request, res: Response) => {
	const category = await categoryService.createBlogCategoryInDB(req.body);
	sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Category created successfully.", data: category });
});

export const getAllBlogCategoriesPublic = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await categoryService.getAllBlogCategoriesFromDB(req.query as Record<string, unknown>, { publicOnly: true });
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Categories retrieved successfully.", data, meta });
});

export const getAllBlogCategoriesAdmin = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await categoryService.getAllBlogCategoriesFromDB(req.query as Record<string, unknown>, { publicOnly: false });
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Categories retrieved successfully.", data, meta });
});

export const getBlogCategoryById = catchAsync(async (req: Request, res: Response) => {
	const category = await categoryService.getBlogCategoryByIdFromDB(req.params.id as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Category retrieved successfully.", data: category });
});

export const updateBlogCategory = catchAsync(async (req: Request, res: Response) => {
	const category = await categoryService.updateBlogCategoryInDB(req.params.id as string, req.body);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Category updated successfully.", data: category });
});

export const deleteBlogCategory = catchAsync(async (req: Request, res: Response) => {
	await categoryService.deleteBlogCategoryFromDB(req.params.id as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Category deleted successfully.", data: null });
});
