import { StatusCodes } from "http-status-codes";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate, QueryConfig } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Backlink } from "../../../generated/prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { assertProjectExists } from "./seo.utils";

const backlinkStatusEnum = z.enum(["PROSPECTING", "OUTREACH_SENT", "NEGOTIATING", "ACQUIRED", "LIVE", "REMOVED"]);

const createValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	sourceUrl: z.string().url("A valid sourceUrl is required."),
	targetUrl: z.string().url("A valid targetUrl is required."),
	anchorText: z.string().min(1).optional(),
	domainAuthority: z.coerce.number().int().min(0).max(100).optional(),
	notes: z.string().max(2000).optional(),
});

const updateValidation = z
	.object({
		sourceUrl: z.string().url().optional(),
		targetUrl: z.string().url().optional(),
		anchorText: z.string().min(1).nullable().optional(),
		domainAuthority: z.coerce.number().int().min(0).max(100).nullable().optional(),
		notes: z.string().max(2000).nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

const updateStatusValidation = z.object({ status: backlinkStatusEnum });

const queryConfig: QueryConfig = {
	filterableFields: {
		projectId: "string",
		status: {
			type: "enum",
			enum: { PROSPECTING: "PROSPECTING", OUTREACH_SENT: "OUTREACH_SENT", NEGOTIATING: "NEGOTIATING", ACQUIRED: "ACQUIRED", LIVE: "LIVE", REMOVED: "REMOVED" },
		},
	},
	searchableFields: ["sourceUrl", "targetUrl", "anchorText"],
	sortableFields: ["createdAt", "acquiredAt", "domainAuthority"],
	defaultSortField: "createdAt",
};

const delegate = prisma.backlink as unknown as PrismaDelegate<Backlink>;

const assertExists = async (id: string) => {
	const record = await prisma.backlink.findUnique({ where: { id } });
	if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Backlink record not found.");
	return record;
};

const createRecord = async (payload: z.infer<typeof createValidation>) => {
	await assertProjectExists(payload.projectId);
	return prisma.backlink.create({ data: payload as Prisma.BacklinkUncheckedCreateInput });
};

const updateRecord = async (id: string, payload: z.infer<typeof updateValidation>) => {
	await assertExists(id);
	return prisma.backlink.update({ where: { id }, data: payload as Prisma.BacklinkUncheckedUpdateInput });
};

const updateStatus = async (id: string, status: z.infer<typeof backlinkStatusEnum>) => {
	const existing = await assertExists(id);
	const acquiredAt = status === "ACQUIRED" && !existing.acquiredAt ? new Date() : existing.acquiredAt;
	return prisma.backlink.update({ where: { id }, data: { status, acquiredAt } });
};

const deleteRecord = async (id: string) => {
	await assertExists(id);
	await prisma.backlink.delete({ where: { id } });
};

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await createRecord(req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Backlink recorded successfully.", data: record });
	}),
);

router.get(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const queryBuilder = new QueryBuilder<Backlink>(delegate, queryConfig);
		const { data, meta } = await queryBuilder.execute(req.query as Record<string, unknown>);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Backlinks retrieved successfully.", data, meta });
	}),
);

router.get(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const record = await assertExists(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Backlink retrieved successfully.", data: record });
	}),
);

router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await updateRecord(req.params.id as string, req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Backlink updated successfully.", data: record });
	}),
);

router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateStatusValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await updateStatus(req.params.id as string, req.body.status);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Backlink status updated successfully.", data: record });
	}),
);

router.delete(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		await deleteRecord(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Backlink deleted successfully.", data: null });
	}),
);

export const backlinkRoutes = router;