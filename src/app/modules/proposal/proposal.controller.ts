import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { proposalService } from "./proposal.service";


 const createProposal = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.createProposalInDB(req.body, req.user?.id ?? "");

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.CREATED,
		message: "Proposal created successfully.",
		data: proposal,
	});
});

 const getAllProposals = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await proposalService.getAllProposalsFromDB(req.query as Record<string, unknown>);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposals retrieved successfully.",
		data,
		meta,
	});
});

 const getProposalById = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.getProposalByIdFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal retrieved successfully.",
		data: proposal,
	});
});

 const updateProposal = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.updateProposalInDB(req.params.id as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal updated successfully.",
		data: proposal,
	});
});

 const sendProposal = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.sendProposalInDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal sent successfully.",
		data: proposal,
	});
});

 const markProposalViewed = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.markProposalViewedInDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal marked as viewed.",
		data: proposal,
	});
});

 const acceptProposal = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.acceptProposalInDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal accepted.",
		data: proposal,
	});
});

 const rejectProposal = catchAsync(async (req: Request, res: Response) => {
	const proposal = await proposalService.rejectProposalInDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal rejected.",
		data: proposal,
	});
});

 const deleteProposal = catchAsync(async (req: Request, res: Response) => {
	await proposalService.deleteProposalFromDB(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Proposal deleted successfully.",
		data: null,
	});
});


export const proposalController = {
	createProposal,
	getAllProposals,
	getProposalById,
	updateProposal,
	sendProposal,
	markProposalViewed,
	acceptProposal,
	rejectProposal,
	deleteProposal,
};