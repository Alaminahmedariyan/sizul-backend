import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { caseStudyService } from "./caseStudy.service";

 const createCaseStudy = catchAsync(
  async (req: Request, res: Response) => {
    const caseStudy = await caseStudyService.createCaseStudyInDB(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Case study created successfully.",
      data: caseStudy,
    });
  },
);

 const getAllCaseStudiesPublic = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await caseStudyService.getAllCaseStudiesFromDB(
      req.query as Record<string, unknown>,
      { publicOnly: true },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Case studies retrieved successfully.",
      data,
      meta,
    });
  },
);

 const getAllCaseStudiesAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { data, meta } = await caseStudyService.getAllCaseStudiesFromDB(
      req.query as Record<string, unknown>,
      { publicOnly: false },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Case studies retrieved successfully.",
      data,
      meta,
    });
  },
);

 const getCaseStudyBySlugPublic = catchAsync(
  async (req: Request, res: Response) => {
    const caseStudy = await caseStudyService.getCaseStudyBySlugFromDB(
      req.params.slug as string,
      { publicOnly: true },
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Case study retrieved successfully.",
      data: caseStudy,
    });
  },
);

 const getCaseStudyByIdAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const caseStudy = await caseStudyService.getCaseStudyByIdFromDB(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Case study retrieved successfully.",
      data: caseStudy,
    });
  },
);

 const updateCaseStudy = catchAsync(
  async (req: Request, res: Response) => {
    const caseStudy = await caseStudyService.updateCaseStudyInDB(
      req.params.id as string,
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Case study updated successfully.",
      data: caseStudy,
    });
  },
);

 const updateCaseStudyStatus = catchAsync(
  async (req: Request, res: Response) => {
    const caseStudy = await caseStudyService.updateCaseStudyStatusInDB(
      req.params.id as string,
      req.body.status,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Case study status updated successfully.",
      data: caseStudy,
    });
  },
);

 const linkCaseStudyService = catchAsync(
  async (req: Request, res: Response) => {
    const link = await caseStudyService.linkCaseStudyServiceInDB(
      req.params.id as string,
      req.body.serviceId,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Service linked successfully.",
      data: link,
    });
  },
);

 const unlinkCaseStudyService = catchAsync(
  async (req: Request, res: Response) => {
    await caseStudyService.unlinkCaseStudyServiceFromDB(
      req.params.id as string,
      req.params.serviceId as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Service unlinked successfully.",
      data: null,
    });
  },
);

 const deleteCaseStudy = catchAsync(
  async (req: Request, res: Response) => {
    await caseStudyService.deleteCaseStudyFromDB(req.params.id as string);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Case study deleted successfully.",
      data: null,
    });
  },
);

export const caseStudyController = {
	createCaseStudy,
	getAllCaseStudiesPublic,
	getAllCaseStudiesAdmin,
	getCaseStudyBySlugPublic,
	getCaseStudyByIdAdmin,
	updateCaseStudy,
	updateCaseStudyStatus,
	linkCaseStudyService,
	unlinkCaseStudyService,
	deleteCaseStudy,
};