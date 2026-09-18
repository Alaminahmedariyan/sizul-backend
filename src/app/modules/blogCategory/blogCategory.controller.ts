import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { blogCategoryService } from "./blogCategory.service";

const createBlogCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await blogCategoryService.createBlogCategoryInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Category created successfully.",
    data: category,
  });
});

const getAllBlogCategoriesPublic = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await blogCategoryService.getAllBlogCategoriesFromDB(
      req.query as Record<string, unknown>,
      { publicOnly: true },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Categories retrieved successfully.",
      data,
      meta,
    });
  },
);

const getAllBlogCategoriesAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await blogCategoryService.getAllBlogCategoriesFromDB(
      req.query as Record<string, unknown>,
      { publicOnly: false },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Categories retrieved successfully.",
      data,
      meta,
    });
  },
);

const getBlogCategoryById = catchAsync(async (req: Request, res: Response) => {
  const category = await blogCategoryService.getBlogCategoryByIdFromDB(
    req.params.id as string,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Category retrieved successfully.",
    data: category,
  });
});

const updateBlogCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await blogCategoryService.updateBlogCategoryInDB(
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Category updated successfully.",
    data: category,
  });
});

const deleteBlogCategory = catchAsync(async (req: Request, res: Response) => {
  await blogCategoryService.deleteBlogCategoryFromDB(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Category deleted successfully.",
    data: null,
  });
});

export const blogCategoryController = {
	createBlogCategory,
	getAllBlogCategoriesPublic,
	getAllBlogCategoriesAdmin,
	getBlogCategoryById,
	updateBlogCategory,
	deleteBlogCategory,
};