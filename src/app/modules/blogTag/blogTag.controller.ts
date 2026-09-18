import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { blogTagService } from "./blogTag.service";

 const createBlogTag = catchAsync(async (req: Request, res: Response) => {
  const tag = await blogTagService.createBlogTagInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Tag created successfully.",
    data: tag,
  });
});

 const getAllBlogTags = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await blogTagService.getAllBlogTagsFromDB(
      req.query as Record<string, unknown>,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Tags retrieved successfully.",
      data,
      meta,
    });
  },
);

 const getBlogTagById = catchAsync(
  async (req: Request, res: Response) => {
    const tag = await blogTagService.getBlogTagByIdFromDB(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Tag retrieved successfully.",
      data: tag,
    });
  },
);

 const updateBlogTag = catchAsync(async (req: Request, res: Response) => {
  const tag = await blogTagService.updateBlogTagInDB(
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Tag updated successfully.",
    data: tag,
  });
});

 const deleteBlogTag = catchAsync(async (req: Request, res: Response) => {
  await blogTagService.deleteBlogTagFromDB(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Tag deleted successfully.",
    data: null,
  });
});


export const blogTagController = {
	createBlogTag,
	getAllBlogTags,
	getBlogTagById,
	updateBlogTag,
	deleteBlogTag,
};
