import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { clientReviewService } from "./clientReview.service";

 const createMyClientReview = catchAsync(async (req: Request, res: Response) => {
	const review = await clientReviewService.createMyClientReviewInDB(req.user?.id ?? "", req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Thank you for your feedback! It will appear after review.",
		data: review,
	});
});

 const getAllClientReviewsPublic = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await clientReviewService.getAllClientReviewsFromDB(req.query as Record<string, unknown>, {
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

 const getAllClientReviewsAdmin = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await clientReviewService.getAllClientReviewsFromDB(req.query as Record<string, unknown>, {
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

 const getClientReviewById = catchAsync(async (req: Request, res: Response) => {
	const review = await clientReviewService.getClientReviewByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Review retrieved successfully.",
		data: review,
	});
});

 const updateReviewApproval = catchAsync(async (req: Request, res: Response) => {
	const review = await clientReviewService.updateReviewApprovalInDB(req.params.id as string, req.body.isApproved);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Review approval updated successfully.",
		data: review,
	});
});

 const updateReviewFeatured = catchAsync(async (req: Request, res: Response) => {
	const review = await clientReviewService.updateReviewFeaturedInDB(req.params.id as string, req.body.isFeatured);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Review featured status updated successfully.",
		data: review,
	});
});

 const deleteClientReview = catchAsync(async (req: Request, res: Response) => {
	await clientReviewService.deleteClientReviewFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Review deleted successfully.",
		data: null,
	});
});

export const clientReviewController = {
	createMyClientReview,
	getAllClientReviewsPublic,
	getAllClientReviewsAdmin,
	getClientReviewById,
	updateReviewApproval,
	updateReviewFeatured,
	deleteClientReview,
};