import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as testimonialService from "./testimonial.service";

export const createTestimonial = catchAsync(async (req: Request, res: Response) => {
	const testimonial = await testimonialService.createTestimonialInDB(req.body);
	sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Testimonial created successfully.", data: testimonial });
});

export const getAllTestimonialsPublic = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await testimonialService.getAllTestimonialsFromDB(req.query as Record<string, unknown>, { publicOnly: true });
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Testimonials retrieved successfully.", data, meta });
});

export const getAllTestimonialsAdmin = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await testimonialService.getAllTestimonialsFromDB(req.query as Record<string, unknown>, { publicOnly: false });
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Testimonials retrieved successfully.", data, meta });
});

export const getTestimonialById = catchAsync(async (req: Request, res: Response) => {
	const testimonial = await testimonialService.getTestimonialByIdFromDB(req.params.id as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Testimonial retrieved successfully.", data: testimonial });
});

export const updateTestimonial = catchAsync(async (req: Request, res: Response) => {
	const testimonial = await testimonialService.updateTestimonialInDB(req.params.id as string, req.body);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Testimonial updated successfully.", data: testimonial });
});

export const updateTestimonialStatus = catchAsync(async (req: Request, res: Response) => {
	const testimonial = await testimonialService.updateTestimonialStatusInDB(req.params.id as string, req.body.status);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Testimonial status updated successfully.", data: testimonial });
});

export const deleteTestimonial = catchAsync(async (req: Request, res: Response) => {
	await testimonialService.deleteTestimonialFromDB(req.params.id as string);
	sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Testimonial deleted successfully.", data: null });
});
