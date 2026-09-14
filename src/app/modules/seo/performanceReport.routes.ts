import { StatusCodes } from "http-status-codes";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate, QueryConfig } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { PerformanceReport } from "../../../generated/prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { assertProjectExists } from "./seo.utils";

const deviceEnum = z.enum(["DESKTOP", "MOBILE"]);

const createValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	pageUrl: z.string().url("A valid pageUrl is required."),
	device: deviceEnum.default("MOBILE"),
	performanceScore: z.coerce.number().int().min(0).max(100).optional(),
	seoScore: z.coerce.number().int().min(0).max(100).optional(),
	metrics: z.unknown().optional(),
	reportUrl: z.string().url().optional(),
});

const queryConfig: QueryConfig = {
	filterableFields: {
		projectId: "string",
		pageUrl: "string",
		device: { type: "enum", enum: { DESKTOP: "DESKTOP", MOBILE: "MOBILE" } },
	},
	sortableFields: ["checkedAt", "createdAt", "performanceScore", "seoScore"],
	defaultSortField: "checkedAt",
};

const delegate = prisma.performanceReport as unknown as PrismaDelegate<PerformanceReport>;

const assertExists = async (id: string) => {
	const record = await prisma.performanceReport.findUnique({ where: { id } });
	if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Performance report not found.");
	return record;
};

const createRecord = async (payload: z.infer<typeof createValidation>) => {
	await assertProjectExists(payload.projectId);
	const { metrics, ...rest } = payload;
	return prisma.performanceReport.create({
		data: { ...rest, ...(metrics !== undefined && { metrics: metrics as Prisma.InputJsonValue }) } as Prisma.PerformanceReportUncheckedCreateInput,
	});
};

const deleteRecord = async (id: string) => {
	await assertExists(id);
	await prisma.performanceReport.delete({ where: { id } });
};

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await createRecord(req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Performance report recorded successfully.", data: record });
	}),
);

router.get(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const queryBuilder = new QueryBuilder<PerformanceReport>(delegate, queryConfig);
		const { data, meta } = await queryBuilder.execute(req.query as Record<string, unknown>);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Performance reports retrieved successfully.", data, meta });
	}),
);

router.get(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const record = await assertExists(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Performance report retrieved successfully.", data: record });
	}),
);

router.delete(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		await deleteRecord(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Performance report deleted successfully.", data: null });
	}),
);

export const performanceReportRoutes = router;