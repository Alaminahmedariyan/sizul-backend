import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as leadService from "./lead.service";

export const createLead = catchAsync(async (req: Request, res: Response) => {
	const lead = await leadService.createLeadInDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Thank you! Your request has been received — we'll be in touch shortly.",
		data: lead,
	});
});

export const getAllLeads = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await leadService.getAllLeadsFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Leads retrieved successfully.",
		data,
		meta,
	});
});

export const getLeadById = catchAsync(async (req: Request, res: Response) => {
	const lead = await leadService.getLeadByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Lead retrieved successfully.",
		data: lead,
	});
});

export const updateLead = catchAsync(async (req: Request, res: Response) => {
	const lead = await leadService.updateLeadInDB(req.params.id as string, req.body, req.user?.id);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Lead updated successfully.",
		data: lead,
	});
});

export const updateLeadStatus = catchAsync(async (req: Request, res: Response) => {
	const lead = await leadService.updateLeadStatusInDB(req.params.id as string, req.body.status, req.user?.id);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Lead status updated successfully.",
		data: lead,
	});
});

export const assignLead = catchAsync(async (req: Request, res: Response) => {
	const lead = await leadService.assignLeadToStaffInDB(req.params.id as string, req.body.staffId, req.user?.id);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Lead assignment updated successfully.",
		data: lead,
	});
});

export const convertLeadToClient = catchAsync(async (req: Request, res: Response) => {
	const result = await leadService.convertLeadToClientInDB(req.params.id as string, req.user?.id);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Lead converted to client successfully.",
		data: result,
	});
});

export const addLeadNote = catchAsync(async (req: Request, res: Response) => {
	const note = await leadService.addLeadNoteInDB(req.params.id as string, req.body.content, req.user?.id);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Note added successfully.",
		data: note,
	});
});

export const getLeadNotes = catchAsync(async (req: Request, res: Response) => {
	const notes = await leadService.getLeadNotesFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Notes retrieved successfully.",
		data: notes,
	});
});

export const getLeadActivities = catchAsync(async (req: Request, res: Response) => {
	const activities = await leadService.getLeadActivitiesFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Activities retrieved successfully.",
		data: activities,
	});
});

export const deleteLead = catchAsync(async (req: Request, res: Response) => {
	await leadService.deleteLeadFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Lead deleted successfully.",
		data: null,
	});
});
