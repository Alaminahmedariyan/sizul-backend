import { StatusCodes } from "http-status-codes";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate, QueryConfig } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { ReviewMonitor } from "../../../generated/prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { assertProjectExists } from "./seo.utils";

const platformEnum = z.enum(["GOOGLE", "FACEBOOK", "YELP", "TRUSTPILOT", "OTHER"]);

const createValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	platform: platformEnum.default("GOOGLE"),
	// schema stores rating as Decimal(2,1) — one decimal place, e.g. 4.5
	rating: z.coerce.number().min(0).max(9.9).optional(),
	reviewCount: z.coerce.number().int().min(0).optional(),
});

const queryConfig: QueryConfig = {
	filterableFields: {
		projectId: "string",
		platform: { type: "enum", enum: { GOOGLE: "GOOGLE", FACEBOOK: "FACEBOOK", YELP: "YELP", TRUSTPILOT: "TRUSTPILOT", OTHER: "OTHER" } },
	},
	sortableFields: ["checkedAt", "createdAt", "reviewCount"],
	defaultSortField: "checkedAt",
};

const delegate = prisma.reviewMonitor as unknown as PrismaDelegate<ReviewMonitor>;

const assertExists = async (id: string) => {
	const record = await prisma.reviewMonitor.findUnique({ where: { id } });
	if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Review monitor record not found.");
	return record;
};

const createRecord = async (payload: z.infer<typeof createValidation>) => {
	await assertProjectExists(payload.projectId);
	const { rating, ...rest } = payload;
	return prisma.reviewMonitor.create({
		data: { ...rest, ...(rating !== undefined && { rating: new Prisma.Decimal(rating) }) } as Prisma.ReviewMonitorUncheckedCreateInput,
	});
};

const deleteRecord = async (id: string) => {
	await assertExists(id);
	await prisma.reviewMonitor.delete({ where: { id } });
};

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await createRecord(req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Review snapshot recorded successfully.", data: record });
	}),
);

router.get(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const queryBuilder = new QueryBuilder<ReviewMonitor>(delegate, queryConfig);
		const { data, meta } = await queryBuilder.execute(req.query as Record<string, unknown>);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Review monitor records retrieved successfully.", data, meta });
	}),
);

router.get(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const record = await assertExists(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Review monitor record retrieved successfully.", data: record });
	}),
);

router.delete(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		await deleteRecord(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Review monitor record deleted successfully.", data: null });
	}),
);

export const reviewMonitorRoutes = router;