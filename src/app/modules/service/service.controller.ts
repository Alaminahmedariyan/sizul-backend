import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { serviceService } from "./service.service";


 const createService = catchAsync(async (req: Request, res: Response) => {
	const service = await serviceService.createServiceInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Service created successfully.",
		data: service,
	});
});

 const getAllServicesPublic = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await serviceService.getAllServicesFromDB(req.query as Record<string, unknown>, {
		publicOnly: true,
	});

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Services retrieved successfully.",
		data,
		meta,
	});
});

 const getAllServicesAdmin = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await serviceService.getAllServicesFromDB(req.query as Record<string, unknown>, {
		publicOnly: false,
	});

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Services retrieved successfully.",
		data,
		meta,
	});
});

 const getServiceBySlugPublic = catchAsync(async (req: Request, res: Response) => {
	const service = await serviceService.getServiceBySlugFromDB(req.params.slug as string, { publicOnly: true });

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Service retrieved successfully.",
		data: service,
	});
});

 const getServiceByIdAdmin = catchAsync(async (req: Request, res: Response) => {
	const service = await serviceService.getServiceByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Service retrieved successfully.",
		data: service,
	});
});

 const updateService = catchAsync(async (req: Request, res: Response) => {
	const service = await serviceService.updateServiceInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Service updated successfully.",
		data: service,
	});
});

 const deleteService = catchAsync(async (req: Request, res: Response) => {
	await serviceService.deleteServiceFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Service deleted successfully.",
		data: null,
	});
});

export const serviceController = {
	createService,
	getAllServicesPublic,
	getAllServicesAdmin,
	getServiceBySlugPublic,
	getServiceByIdAdmin,
	updateService,
	deleteService,
};