import { StatusCodes } from "http-status-codes";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate, QueryConfig } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { SEOAudit } from "../../../generated/prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { assertProjectExists } from "./seo.utils";
import { createNotification } from "../notification/notification.service";

const createValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	title: z.string().min(1).max(200).optional(),
	score: z.coerce.number().int().min(0).max(100).optional(),
	issues: z.unknown().optional(),
	reportUrl: z.string().url().optional(),
	summary: z.string().max(3000).optional(),
});

const queryConfig: QueryConfig = {
	filterableFields: { projectId: "string" },
	searchableFields: ["title", "summary"],
	sortableFields: ["auditDate", "createdAt", "score"],
	defaultSortField: "auditDate",
};

const delegate = prisma.sEOAudit as unknown as PrismaDelegate<SEOAudit>;

const assertExists = async (id: string) => {
	const record = await prisma.sEOAudit.findUnique({ where: { id } });
	if (!record) throw new AppError(StatusCodes.NOT_FOUND, "SEO audit not found.");
	return record;
};

const createRecord = async (payload: z.infer<typeof createValidation>) => {
	await assertProjectExists(payload.projectId);
	const { issues, ...rest } = payload;
	const audit = await prisma.sEOAudit.create({
		data: { ...rest, ...(issues !== undefined && { issues: issues as Prisma.InputJsonValue }) } as Prisma.SEOAuditUncheckedCreateInput,
	});

	try {
		const project = await prisma.project.findUnique({ where: { id: payload.projectId }, include: { client: true } });
		if (project?.client?.userId) {
			await createNotification({
				userId: project.client.userId,
				type: "SEO_REPORT",
				entityType: "PROJECT",
				entityId: project.id,
				title: "New SEO audit available",
				message: `A new SEO audit report is ready for "${project.name}".`,
			});
		}
	} catch (error) {
		console.error("[SEOAudit] Failed to notify client of new report:", error);
	}

	return audit;
};

const deleteRecord = async (id: string) => {
	await assertExists(id);
	await prisma.sEOAudit.delete({ where: { id } });
};

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await createRecord(req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "SEO audit recorded successfully.", data: record });
	}),
);

router.get(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const queryBuilder = new QueryBuilder<SEOAudit>(delegate, queryConfig);
		const { data, meta } = await queryBuilder.execute(req.query as Record<string, unknown>);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "SEO audits retrieved successfully.", data, meta });
	}),
);

router.get(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const record = await assertExists(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "SEO audit retrieved successfully.", data: record });
	}),
);

router.delete(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		await deleteRecord(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "SEO audit deleted successfully.", data: null });
	}),
);

export const seoAuditRoutes = router;