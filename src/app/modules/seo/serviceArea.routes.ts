import { StatusCodes } from "http-status-codes";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate, QueryConfig } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { ServiceArea } from "../../../generated/prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { assertProjectExists } from "./seo.utils";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	city: z.string().min(1, "City is required.").max(150),
	state: z.string().min(1).max(150).optional(),
	slug: z.string().min(1).max(150).regex(slugPattern, "Slug must be lowercase, alphanumeric, and hyphen-separated."),
	pageUrl: z.string().url().optional(),
});

const updateValidation = z
	.object({
		city: z.string().min(1).max(150).optional(),
		state: z.string().min(1).max(150).nullable().optional(),
		pageUrl: z.string().url().nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

const publishValidation = z.object({ publishedAt: z.coerce.date().nullable() });

const queryConfig: QueryConfig = {
	searchableFields: ["city", "state"],
	filterableFields: { projectId: "string", slug: "string" },
	sortableFields: ["createdAt", "city", "publishedAt"],
	defaultSortField: "createdAt",
};

const delegate = prisma.serviceArea as unknown as PrismaDelegate<ServiceArea>;

const assertExists = async (id: string) => {
	const record = await prisma.serviceArea.findUnique({ where: { id } });
	if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Service area not found.");
	return record;
};

const createRecord = async (payload: z.infer<typeof createValidation>) => {
	await assertProjectExists(payload.projectId);

	const existing = await prisma.serviceArea.findUnique({
		where: { projectId_slug: { projectId: payload.projectId, slug: payload.slug } },
	});
	if (existing) {
		throw new AppError(StatusCodes.CONFLICT, "A service area with this slug already exists for this project.");
	}

	return prisma.serviceArea.create({ data: payload as Prisma.ServiceAreaUncheckedCreateInput });
};

const updateRecord = async (id: string, payload: z.infer<typeof updateValidation>) => {
	await assertExists(id);
	return prisma.serviceArea.update({ where: { id }, data: payload as Prisma.ServiceAreaUncheckedUpdateInput });
};

const setPublished = async (id: string, publishedAt: Date | null) => {
	await assertExists(id);
	return prisma.serviceArea.update({ where: { id }, data: { publishedAt } });
};

const deleteRecord = async (id: string) => {
	await assertExists(id);
	await prisma.serviceArea.delete({ where: { id } });
};

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await createRecord(req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Service area created successfully.", data: record });
	}),
);

router.get(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const queryBuilder = new QueryBuilder<ServiceArea>(delegate, queryConfig);
		const { data, meta } = await queryBuilder.execute(req.query as Record<string, unknown>);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Service areas retrieved successfully.", data, meta });
	}),
);

router.get(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const record = await assertExists(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Service area retrieved successfully.", data: record });
	}),
);

router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await updateRecord(req.params.id as string, req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Service area updated successfully.", data: record });
	}),
);

router.patch(
	"/:id/publish",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(publishValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await setPublished(req.params.id as string, req.body.publishedAt);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Publish status updated successfully.", data: record });
	}),
);

router.delete(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		await deleteRecord(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Service area deleted successfully.", data: null });
	}),
);

export const serviceAreaRoutes = router;