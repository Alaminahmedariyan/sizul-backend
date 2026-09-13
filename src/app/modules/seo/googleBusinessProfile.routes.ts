import { StatusCodes } from "http-status-codes";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import AppError from "../../errors/appError";
import { prisma } from "../../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { assertProjectExists } from "./seo.utils";

// One-to-one with Project (projectId is @unique), so this is upsert-style rather
// than a typical list/create CRUD.
const upsertValidation = z.object({
	businessName: z.string().min(1, "Business name is required.").max(200),
	gbpUrl: z.string().url().optional(),
	category: z.string().min(1).optional(),
	address: z.string().min(1).optional(),
	phone: z.string().min(1).optional(),
	notes: z.string().max(2000).optional(),
});

const updateVerificationValidation = z.object({ isVerified: z.boolean() });

const assertExists = async (projectId: string) => {
	const profile = await prisma.googleBusinessProfile.findUnique({ where: { projectId } });
	if (!profile) throw new AppError(StatusCodes.NOT_FOUND, "No Google Business Profile is linked to this project yet.");
	return profile;
};

const router = Router();

router.put(
	"/:projectId",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(upsertValidation),
	catchAsync(async (req: Request, res: Response) => {
		const projectId = req.params.projectId as string;
		await assertProjectExists(projectId);

		const profile = await prisma.googleBusinessProfile.upsert({
			where: { projectId },
			create: { projectId, ...req.body },
			update: req.body,
		});

		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Google Business Profile saved successfully.", data: profile });
	}),
);

router.get(
	"/:projectId",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const profile = await assertExists(req.params.projectId as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Google Business Profile retrieved successfully.", data: profile });
	}),
);

router.patch(
	"/:projectId/verification",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateVerificationValidation),
	catchAsync(async (req: Request, res: Response) => {
		const projectId = req.params.projectId as string;
		await assertExists(projectId);

		const profile = await prisma.googleBusinessProfile.update({ where: { projectId }, data: { isVerified: req.body.isVerified } });
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Verification status updated successfully.", data: profile });
	}),
);

router.patch(
	"/:projectId/mark-optimized",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const projectId = req.params.projectId as string;
		await assertExists(projectId);

		const profile = await prisma.googleBusinessProfile.update({ where: { projectId }, data: { lastOptimizedAt: new Date() } });
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Marked as optimized.", data: profile });
	}),
);

router.delete(
	"/:projectId",
	requireAuth,
	requireRole("ADMIN"),
	catchAsync(async (req: Request, res: Response) => {
		await assertExists(req.params.projectId as string);
		await prisma.googleBusinessProfile.delete({ where: { projectId: req.params.projectId as string } });
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Google Business Profile deleted successfully.", data: null });
	}),
);

export const googleBusinessProfileRoutes = router;