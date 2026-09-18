import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { testimonialService } from "./testimonial.service";

 const createTestimonial = catchAsync(
  async (req: Request, res: Response) => {
    const testimonial = await testimonialService.createTestimonialInDB(
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Testimonial created successfully.",
      data: testimonial,
    });
  },
);

 const getAllTestimonialsPublic = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await testimonialService.getAllTestimonialsFromDB(
      req.query as Record<string, unknown>,
      { publicOnly: true },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Testimonials retrieved successfully.",
      data,
      meta,
    });
  },
);

 const getAllTestimonialsAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await testimonialService.getAllTestimonialsFromDB(
      req.query as Record<string, unknown>,
      { publicOnly: false },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Testimonials retrieved successfully.",
      data,
      meta,
    });
  },
);

 const getTestimonialById = catchAsync(
  async (req: Request, res: Response) => {
    const testimonial = await testimonialService.getTestimonialByIdFromDB(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Testimonial retrieved successfully.",
      data: testimonial,
    });
  },
);

 const updateTestimonial = catchAsync(
  async (req: Request, res: Response) => {
    const testimonial = await testimonialService.updateTestimonialInDB(
      req.params.id as string,
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Testimonial updated successfully.",
      data: testimonial,
    });
  },
);

 const updateTestimonialStatus = catchAsync(
  async (req: Request, res: Response) => {
    const testimonial = await testimonialService.updateTestimonialStatusInDB(
      req.params.id as string,
      req.body.status,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Testimonial status updated successfully.",
      data: testimonial,
    });
  },
);

 const deleteTestimonial = catchAsync(
  async (req: Request, res: Response) => {
    await testimonialService.deleteTestimonialFromDB(req.params.id as string);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Testimonial deleted successfully.",
      data: null,
    });
  },
);

export const testimonialController = {
	createTestimonial,
	getAllTestimonialsPublic,
	getAllTestimonialsAdmin,
	getTestimonialById,
	updateTestimonial,
	updateTestimonialStatus,
	deleteTestimonial,
};