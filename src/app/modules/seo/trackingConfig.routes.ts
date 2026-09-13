import { StatusCodes } from "http-status-codes";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import AppError from "../../errors/appError";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { assertProjectExists } from "./seo.utils";

// One-to-one with Project (projectId is @unique) — upsert-style, like GoogleBusinessProfile.
const upsertValidation = z.object({
	ga4MeasurementId: z.string().min(1).optional(),
	gtmContainerId: z.string().min(1).optional(),
	metaPixelId: z.string().min(1).optional(),
	whatsappNumber: z.string().min(1).optional(),
	conversionGoals: z.unknown().optional(),
});

const assertExists = async (projectId: string) => {
	const config = await prisma.trackingConfig.findUnique({ where: { projectId } });
	if (!config) throw new AppError(StatusCodes.NOT_FOUND, "No tracking config is set up for this project yet.");
	return config;
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

		const { conversionGoals, ...rest } = req.body;
		const jsonField = conversionGoals !== undefined ? { conversionGoals: conversionGoals as Prisma.InputJsonValue } : {};

		const config = await prisma.trackingConfig.upsert({
			where: { projectId },
			create: { projectId, ...rest, ...jsonField },
			update: { ...rest, ...jsonField },
		});

		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Tracking config saved successfully.", data: config });
	}),
);

router.get(
	"/:projectId",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const config = await assertExists(req.params.projectId as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Tracking config retrieved successfully.", data: config });
	}),
);

router.delete(
	"/:projectId",
	requireAuth,
	requireRole("ADMIN"),
	catchAsync(async (req: Request, res: Response) => {
		await assertExists(req.params.projectId as string);
		await prisma.trackingConfig.delete({ where: { projectId: req.params.projectId as string } });
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Tracking config deleted successfully.", data: null });
	}),
);

export const trackingConfigRoutes = router;