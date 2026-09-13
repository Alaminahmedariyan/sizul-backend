import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as clientService from "./client.service";

export const createClient = catchAsync(async (req: Request, res: Response) => {
	const client = await clientService.createClientInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Client created successfully.",
		data: client,
	});
});

export const getAllClients = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await clientService.getAllClientsFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Clients retrieved successfully.",
		data,
		meta,
	});
});

export const getClientById = catchAsync(async (req: Request, res: Response) => {
	const client = await clientService.getClientByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Client retrieved successfully.",
		data: client,
	});
});

export const getMyClientProfile = catchAsync(async (req: Request, res: Response) => {
	const client = await clientService.getMyClientProfileFromDB(req.user?.id ?? "");

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Client profile retrieved successfully.",
		data: client,
	});
});

export const updateMyClientProfile = catchAsync(async (req: Request, res: Response) => {
	const client = await clientService.updateMyClientProfileInDB(req.user?.id ?? "", req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Client profile updated successfully.",
		data: client,
	});
});

export const updateClient = catchAsync(async (req: Request, res: Response) => {
	const client = await clientService.updateClientInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Client updated successfully.",
		data: client,
	});
});

export const updateClientActive = catchAsync(async (req: Request, res: Response) => {
	const client = await clientService.updateClientActiveInDB(req.params.id as string, req.body.isActive);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Client status updated successfully.",
		data: client,
	});
});

export const deleteClient = catchAsync(async (req: Request, res: Response) => {
	await clientService.deleteClientFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Client deleted successfully.",
		data: null,
	});
});
