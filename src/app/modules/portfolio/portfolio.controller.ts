import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import AppError from "../../errors/appError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { portfolioService } from "./portfolio.service";

const createPortfolio = catchAsync(async (req: Request, res: Response) => {
	const portfolio = await portfolioService.createPortfolioInDB(req.body);
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Portfolio item created successfully.",
		data: portfolio,
	});
});

const getAllPortfoliosPublic = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await portfolioService.getAllPortfoliosFromDB(req.query as Record<string, unknown>, {
		publicOnly: true,
	});
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Portfolio items retrieved successfully.",
		data,
		meta,
	});
});

const getAllPortfoliosAdmin = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await portfolioService.getAllPortfoliosFromDB(req.query as Record<string, unknown>, {
		publicOnly: false,
	});
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Portfolio items retrieved successfully.",
		data,
		meta,
	});
});

const getPortfolioBySlugPublic = catchAsync(async (req: Request, res: Response) => {
	const portfolio = await portfolioService.getPortfolioBySlugFromDB(req.params.slug as string, { publicOnly: true });
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Portfolio item retrieved successfully.",
		data: portfolio,
	});
});

const getPortfolioByIdAdmin = catchAsync(async (req: Request, res: Response) => {
	const portfolio = await portfolioService.getPortfolioByIdFromDB(req.params.id as string);
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Portfolio item retrieved successfully.",
		data: portfolio,
	});
});

const updatePortfolio = catchAsync(async (req: Request, res: Response) => {
	const portfolio = await portfolioService.updatePortfolioInDB(req.params.id as string, req.body);
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Portfolio item updated successfully.",
		data: portfolio,
	});
});

const updatePortfolioStatus = catchAsync(async (req: Request, res: Response) => {
	const portfolio = await portfolioService.updatePortfolioStatusInDB(req.params.id as string, req.body.status);
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Portfolio status updated successfully.",
		data: portfolio,
	});
});

// Now requires a real uploaded file (multipart/form-data, field "file") — see
// portfolio.routes.ts's multer middleware, which runs before this handler.
const addPortfolioImage = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new AppError(StatusCodes.BAD_REQUEST, "An image file is required (field name: 'file').");
	}

	const image = await portfolioService.addPortfolioImageInDB(req.params.id as string, req.file, req.body);
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Image added successfully.",
		data: image,
	});
});

const removePortfolioImage = catchAsync(async (req: Request, res: Response) => {
	await portfolioService.removePortfolioImageFromDB(req.params.imageId as string);
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Image removed successfully.",
		data: null,
	});
});

const linkPortfolioService = catchAsync(async (req: Request, res: Response) => {
	const link = await portfolioService.linkPortfolioServiceInDB(req.params.id as string, req.body.serviceId);
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Service linked successfully.",
		data: link,
	});
});

const unlinkPortfolioService = catchAsync(async (req: Request, res: Response) => {
	await portfolioService.unlinkPortfolioServiceFromDB(req.params.id as string, req.params.serviceId as string);
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Service unlinked successfully.",
		data: null,
	});
});

const deletePortfolio = catchAsync(async (req: Request, res: Response) => {
	await portfolioService.deletePortfolioFromDB(req.params.id as string);
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Portfolio item deleted successfully.",
		data: null,
	});
});

export const portfolioController = {
	createPortfolio,
	getAllPortfoliosPublic,
	getAllPortfoliosAdmin,
	getPortfolioBySlugPublic,
	getPortfolioByIdAdmin,
	updatePortfolio,
	updatePortfolioStatus,
	addPortfolioImage,
	removePortfolioImage,
	linkPortfolioService,
	unlinkPortfolioService,
	deletePortfolio,
};