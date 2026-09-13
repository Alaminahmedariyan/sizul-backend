import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as postService from "./blogPost.service";

export const createBlogPost = catchAsync(async (req: Request, res: Response) => {
	const post = await postService.createBlogPostInDB(req.body, req.user?.id);
	sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Blog post created successfully.", data: post });
});

export const getAllBlogPostsPublic = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await postService.getAllBlogPostsFromDB(req.query as Record<string, unknown>, { publicOnly: true });
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Blog posts retrieved successfully.", data, meta });
});

export const getAllBlogPostsAdmin = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await postService.getAllBlogPostsFromDB(req.query as Record<string, unknown>, { publicOnly: false });
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Blog posts retrieved successfully.", data, meta });
});

export const getBlogPostBySlugPublic = catchAsync(async (req: Request, res: Response) => {
	const post = await postService.getBlogPostBySlugFromDB(req.params.slug as string, { publicOnly: true });
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Blog post retrieved successfully.", data: post });
});

export const getBlogPostByIdAdmin = catchAsync(async (req: Request, res: Response) => {
	const post = await postService.getBlogPostByIdFromDB(req.params.id as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Blog post retrieved successfully.", data: post });
});

export const updateBlogPost = catchAsync(async (req: Request, res: Response) => {
	const post = await postService.updateBlogPostInDB(req.params.id as string, req.body);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Blog post updated successfully.", data: post });
});

export const updateBlogPostStatus = catchAsync(async (req: Request, res: Response) => {
	const post = await postService.updateBlogPostStatusInDB(req.params.id as string, req.body.status);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Blog post status updated successfully.", data: post });
});

export const deleteBlogPost = catchAsync(async (req: Request, res: Response) => {
	await postService.deleteBlogPostFromDB(req.params.id as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Blog post deleted successfully.", data: null });
});
