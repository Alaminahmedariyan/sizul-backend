import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { pricingPlanService } from "./pricingPlan.service";

 const createPricingPlan = catchAsync(async (req: Request, res: Response) => {
	const plan = await pricingPlanService.createPricingPlanInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Pricing plan created successfully.",
		data: plan,
	});
});

 const getAllPricingPlansPublic = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await pricingPlanService.getAllPricingPlansFromDB(req.query as Record<string, unknown>, {
		publicOnly: true,
	});

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Pricing plans retrieved successfully.",
		data,
		meta,
	});
});

 const getAllPricingPlansAdmin = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await pricingPlanService.getAllPricingPlansFromDB(req.query as Record<string, unknown>, {
		publicOnly: false,
	});

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Pricing plans retrieved successfully.",
		data,
		meta,
	});
});

 const getPricingPlanById = catchAsync(async (req: Request, res: Response) => {
	const plan = await pricingPlanService.getPricingPlanByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Pricing plan retrieved successfully.",
		data: plan,
	});
});

 const updatePricingPlan = catchAsync(async (req: Request, res: Response) => {
	const plan = await pricingPlanService.updatePricingPlanInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Pricing plan updated successfully.",
		data: plan,
	});
});

 const deletePricingPlan = catchAsync(async (req: Request, res: Response) => {
	await pricingPlanService.deletePricingPlanFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Pricing plan deleted successfully.",
		data: null,
	});
});


export const pricingPlanController = {
	createPricingPlan,
	getAllPricingPlansPublic,
	getAllPricingPlansAdmin,
	getPricingPlanById,
	updatePricingPlan,
	deletePricingPlan,
};