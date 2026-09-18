import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { blogPostService } from "./blogPost.service";

 const createBlogPost = catchAsync(
  async (req: Request, res: Response) => {
    const post = await blogPostService.createBlogPostInDB(
      req.body,
      req.user?.id,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Blog post created successfully.",
      data: post,
    });
  },
);

 const getAllBlogPostsPublic = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await blogPostService.getAllBlogPostsFromDB(
      req.query as Record<string, unknown>,
      { publicOnly: true },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Blog posts retrieved successfully.",
      data,
      meta,
    });
  },
);

 const getAllBlogPostsAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await blogPostService.getAllBlogPostsFromDB(
      req.query as Record<string, unknown>,
      { publicOnly: false },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Blog posts retrieved successfully.",
      data,
      meta,
    });
  },
);

 const getBlogPostBySlugPublic = catchAsync(
  async (req: Request, res: Response) => {
    const post = await blogPostService.getBlogPostBySlugFromDB(
      req.params.slug as string,
      { publicOnly: true },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Blog post retrieved successfully.",
      data: post,
    });
  },
);

 const getBlogPostByIdAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const post = await blogPostService.getBlogPostByIdFromDB(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Blog post retrieved successfully.",
      data: post,
    });
  },
);

 const updateBlogPost = catchAsync(
  async (req: Request, res: Response) => {
    const post = await blogPostService.updateBlogPostInDB(
      req.params.id as string,
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Blog post updated successfully.",
      data: post,
    });
  },
);

 const updateBlogPostStatus = catchAsync(
  async (req: Request, res: Response) => {
    const post = await blogPostService.updateBlogPostStatusInDB(
      req.params.id as string,
      req.body.status,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Blog post status updated successfully.",
      data: post,
    });
  },
);

 const deleteBlogPost = catchAsync(
  async (req: Request, res: Response) => {
    await blogPostService.deleteBlogPostFromDB(req.params.id as string);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Blog post deleted successfully.",
      data: null,
    });
  },
);

export const blogPostController = {
	createBlogPost,
	getAllBlogPostsPublic,
	getAllBlogPostsAdmin,
	getBlogPostBySlugPublic,
	getBlogPostByIdAdmin,
	updateBlogPost,
	updateBlogPostStatus,
	deleteBlogPost,
};