import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as consultationService from "./consultation.service";

export const createConsultation = catchAsync(async (req: Request, res: Response) => {
	const consultation = await consultationService.createConsultationInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Consultation scheduled successfully.",
		data: consultation,
	});
});

export const getAllConsultations = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await consultationService.getAllConsultationsFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Consultations retrieved successfully.",
		data,
		meta,
	});
});

export const getConsultationById = catchAsync(async (req: Request, res: Response) => {
	const consultation = await consultationService.getConsultationByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Consultation retrieved successfully.",
		data: consultation,
	});
});

export const updateConsultation = catchAsync(async (req: Request, res: Response) => {
	const consultation = await consultationService.updateConsultationInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Consultation updated successfully.",
		data: consultation,
	});
});

export const updateConsultationStatus = catchAsync(async (req: Request, res: Response) => {
	const consultation = await consultationService.updateConsultationStatusInDB(req.params.id as string, req.body.status);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Consultation status updated successfully.",
		data: consultation,
	});
});

export const assignConsultation = catchAsync(async (req: Request, res: Response) => {
	const consultation = await consultationService.assignConsultationToStaffInDB(req.params.id as string, req.body.staffId);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Consultation assignment updated successfully.",
		data: consultation,
	});
});

export const deleteConsultation = catchAsync(async (req: Request, res: Response) => {
	await consultationService.deleteConsultationFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Consultation deleted successfully.",
		data: null,
	});
});
