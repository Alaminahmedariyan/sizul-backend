import { StatusCodes } from "http-status-codes";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate, QueryConfig } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Citation } from "../../../generated/prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { assertProjectExists } from "./seo.utils";

const citationStatusEnum = z.enum(["PENDING", "SUBMITTED", "LIVE", "REJECTED"]);

const createValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	directoryName: z.string().min(1, "Directory name is required.").max(150),
	url: z.string().url().optional(),
	notes: z.string().max(2000).optional(),
});

const updateValidation = z
	.object({
		directoryName: z.string().min(1).max(150).optional(),
		url: z.string().url().nullable().optional(),
		notes: z.string().max(2000).nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

const updateStatusValidation = z.object({ status: citationStatusEnum });

const queryConfig: QueryConfig = {
	filterableFields: {
		projectId: "string",
		status: { type: "enum", enum: { PENDING: "PENDING", SUBMITTED: "SUBMITTED", LIVE: "LIVE", REJECTED: "REJECTED" } },
	},
	searchableFields: ["directoryName"],
	sortableFields: ["createdAt", "submittedAt"],
	defaultSortField: "createdAt",
};

const delegate = prisma.citation as unknown as PrismaDelegate<Citation>;

const assertExists = async (id: string) => {
	const record = await prisma.citation.findUnique({ where: { id } });
	if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Citation record not found.");
	return record;
};

const createRecord = async (payload: z.infer<typeof createValidation>) => {
	await assertProjectExists(payload.projectId);
	return prisma.citation.create({ data: payload as Prisma.CitationUncheckedCreateInput });
};

const updateRecord = async (id: string, payload: z.infer<typeof updateValidation>) => {
	await assertExists(id);
	return prisma.citation.update({ where: { id }, data: payload as Prisma.CitationUncheckedUpdateInput });
};

const updateStatus = async (id: string, status: z.infer<typeof citationStatusEnum>) => {
	const existing = await assertExists(id);
	const submittedAt = status === "SUBMITTED" && !existing.submittedAt ? new Date() : existing.submittedAt;
	return prisma.citation.update({ where: { id }, data: { status, submittedAt } });
};

const deleteRecord = async (id: string) => {
	await assertExists(id);
	await prisma.citation.delete({ where: { id } });
};

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await createRecord(req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Citation recorded successfully.", data: record });
	}),
);

router.get(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const queryBuilder = new QueryBuilder<Citation>(delegate, queryConfig);
		const { data, meta } = await queryBuilder.execute(req.query as Record<string, unknown>);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Citations retrieved successfully.", data, meta });
	}),
);

router.get(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const record = await assertExists(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Citation retrieved successfully.", data: record });
	}),
);

router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await updateRecord(req.params.id as string, req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Citation updated successfully.", data: record });
	}),
);

router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateStatusValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await updateStatus(req.params.id as string, req.body.status);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Citation status updated successfully.", data: record });
	}),
);

router.delete(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		await deleteRecord(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Citation deleted successfully.", data: null });
	}),
);

export const citationRoutes = router;