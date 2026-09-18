import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { faqService } from "./faq.service";

 const createFaq = catchAsync(async (req: Request, res: Response) => {
  const faq = await faqService.createFaqInDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "FAQ created successfully.",
    data: faq,
  });
});

 const getAllFaqsPublic = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await faqService.getAllFaqsFromDB(
      req.query as Record<string, unknown>,
      { publicOnly: true },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "FAQs retrieved successfully.",
      data,
      meta,
    });
  },
);

 const getAllFaqsAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await faqService.getAllFaqsFromDB(
      req.query as Record<string, unknown>,
      { publicOnly: false },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "FAQs retrieved successfully.",
      data,
      meta,
    });
  },
);

 const getFaqById = catchAsync(async (req: Request, res: Response) => {
  const faq = await faqService.getFaqByIdFromDB(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "FAQ retrieved successfully.",
    data: faq,
  });
});

 const updateFaq = catchAsync(async (req: Request, res: Response) => {
  const faq = await faqService.updateFaqInDB(req.params.id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "FAQ updated successfully.",
    data: faq,
  });
});

 const deleteFaq = catchAsync(async (req: Request, res: Response) => {
  await faqService.deleteFaqFromDB(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "FAQ deleted successfully.",
    data: null,
  });
});

export const faqController = {
	createFaq,
	getAllFaqsPublic,
	getAllFaqsAdmin,
	getFaqById,
	updateFaq,
	deleteFaq,
};