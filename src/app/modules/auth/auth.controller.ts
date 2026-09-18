import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

export const getMySession = catchAsync(async (req: Request, res: Response) => {
	sendResponse(res, {
		success: true,
		statusCode: StatusCodes.OK,
		message: "Session is active.",
		data: {
			id: req.user?.id,
			email: req.user?.email,
			role: req.user?.role,
			emailVerified: req.user?.emailVerified,
		},
	});
});

export const authController = { getMySession };