import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as reviewService from "./clientReview.service";

export const createMyClientReview = catchAsync(async (req: Request, res: Response) => {
	const review = await reviewService.createMyClientReviewInDB(req.user?.id ?? "", req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Thank you for your feedback! It will appear after review.",
		data: review,
	});
});

export const getAllClientReviewsPublic = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await reviewService.getAllClientReviewsFromDB(req.query as Record<string, unknown>, {
		publicOnly: true,
	});

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Reviews retrieved successfully.",
		data,
		meta,
	});
});

export const getAllClientReviewsAdmin = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await reviewService.getAllClientReviewsFromDB(req.query as Record<string, unknown>, {
		publicOnly: false,
	});

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Reviews retrieved successfully.",
		data,
		meta,
	});
});

export const getClientReviewById = catchAsync(async (req: Request, res: Response) => {
	const review = await reviewService.getClientReviewByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Review retrieved successfully.",
		data: review,
	});
});

export const updateReviewApproval = catchAsync(async (req: Request, res: Response) => {
	const review = await reviewService.updateReviewApprovalInDB(req.params.id as string, req.body.isApproved);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Review approval updated successfully.",
		data: review,
	});
});

export const updateReviewFeatured = catchAsync(async (req: Request, res: Response) => {
	const review = await reviewService.updateReviewFeaturedInDB(req.params.id as string, req.body.isFeatured);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Review featured status updated successfully.",
		data: review,
	});
});

export const deleteClientReview = catchAsync(async (req: Request, res: Response) => {
	await reviewService.deleteClientReviewFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Review deleted successfully.",
		data: null,
	});
});
