import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as proposalService from "./proposal.service";

export const createProposal = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.createProposalInDB(req.body, req.user?.id ?? "");

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Proposal created successfully.",
		data: proposal,
	});
});

export const getAllProposals = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await proposalService.getAllProposalsFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposals retrieved successfully.",
		data,
		meta,
	});
});

export const getProposalById = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.getProposalByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal retrieved successfully.",
		data: proposal,
	});
});

export const updateProposal = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.updateProposalInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal updated successfully.",
		data: proposal,
	});
});

export const sendProposal = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.sendProposalInDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal sent successfully.",
		data: proposal,
	});
});

export const markProposalViewed = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.markProposalViewedInDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal marked as viewed.",
		data: proposal,
	});
});

export const acceptProposal = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.acceptProposalInDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal accepted.",
		data: proposal,
	});
});

export const rejectProposal = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.rejectProposalInDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal rejected.",
		data: proposal,
	});
});

export const deleteProposal = catchAsync(async (req: Request, res: Response) => {
	await proposalService.deleteProposalFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal deleted successfully.",
		data: null,
	});
});
