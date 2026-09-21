import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { paymentService } from "./payment.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createStripeCheckout = catchAsync(async (req: Request, res: Response) => {
	const result = await paymentService.createStripeCheckoutInDB(req.body.proposalId, req.user!);
	sendResponse(res, {
		statusCode: StatusCodes.OK,
		success: true,
		message: "Stripe checkout session created successfully.",
		data: result,
	});
});

// Note: Stripe webhook is handled separately in payment.webhook.ts / route,
// not through this controller — it needs the raw body, not parsed JSON.

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
	const result = await paymentService.getAllPaymentsFromDB(req.query);
	sendResponse(res, {
		statusCode: StatusCodes.OK,
		success: true,
		message: "Payments retrieved successfully.",
		data: result,
	});
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
	const result = await paymentService.getPaymentByIdFromDB(req.params.id as string);
	sendResponse(res, {
		statusCode: StatusCodes.OK,
		success: true,
		message: "Payment retrieved successfully.",
		data: result,
	});
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
	const result = await paymentService.getMyPaymentsFromDB(req.user!.id, req.query);
	sendResponse(res, {
		statusCode: StatusCodes.OK,
		success: true,
		message: "Your payments retrieved successfully.",
		data: result,
	});
});

const refundPayment = catchAsync(async (req: Request, res: Response) => {
	const result = await paymentService.refundStripePaymentInDB(req.params.id as string);
	sendResponse(res, {
		statusCode: StatusCodes.OK,
		success: true,
		message: "Payment refunded successfully.",
		data: result,
	});
});

export const paymentController = {
	createStripeCheckout,
	getAllPayments,
	getPaymentById,
	getMyPayments,
	refundPayment,
};