import { StatusCodes } from "http-status-codes";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate, QueryConfig } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { KeywordRanking } from "../../../generated/prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { assertProjectExists } from "./seo.utils";

// ---------- validation ----------
const searchEngineEnum = z.enum(["GOOGLE", "BING"]);
const deviceEnum = z.enum(["DESKTOP", "MOBILE"]);

const createValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	keyword: z.string().min(1, "Keyword is required.").max(200),
	targetUrl: z.string().url().optional(),
	searchEngine: searchEngineEnum.default("GOOGLE"),
	device: deviceEnum.default("DESKTOP"),
	location: z.string().min(1).optional(),
	rank: z.coerce.number().int().min(0).optional(),
});

const updateValidation = z
	.object({
		rank: z.coerce.number().int().min(0).nullable().optional(),
		location: z.string().min(1).nullable().optional(),
		targetUrl: z.string().url().nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

// ---------- constant ----------
const queryConfig: QueryConfig = {
	filterableFields: {
		projectId: "string",
		keyword: "string",
		searchEngine: { type: "enum", enum: { GOOGLE: "GOOGLE", BING: "BING" } },
		device: { type: "enum", enum: { DESKTOP: "DESKTOP", MOBILE: "MOBILE" } },
	},
	searchableFields: ["keyword"],
	sortableFields: ["checkedAt", "createdAt", "rank"],
	defaultSortField: "checkedAt",
};

// ---------- service ----------
const delegate = prisma.keywordRanking as unknown as PrismaDelegate<KeywordRanking>;

const assertExists = async (id: string) => {
	const record = await prisma.keywordRanking.findUnique({ where: { id } });
	if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Keyword ranking record not found.");
	return record;
};

// When a fresh rank check comes in, shift the old "rank" into "previousRank" so
// rank-change/trend reporting has something to compare against.
const createRecord = async (payload: z.infer<typeof createValidation>) => {
	await assertProjectExists(payload.projectId);

	const latest = await prisma.keywordRanking.findFirst({
		where: { projectId: payload.projectId, keyword: payload.keyword, searchEngine: payload.searchEngine, device: payload.device },
		orderBy: { checkedAt: "desc" },
	});

	return prisma.keywordRanking.create({
		data: { ...payload, previousRank: latest?.rank ?? null } as Prisma.KeywordRankingUncheckedCreateInput,
	});
};

const updateRecord = async (id: string, payload: z.infer<typeof updateValidation>) => {
	await assertExists(id);
	return prisma.keywordRanking.update({ where: { id }, data: payload as Prisma.KeywordRankingUncheckedUpdateInput });
};

const deleteRecord = async (id: string) => {
	await assertExists(id);
	await prisma.keywordRanking.delete({ where: { id } });
};

// ---------- controller + routes ----------
const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await createRecord(req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Keyword ranking recorded successfully.", data: record });
	}),
);

router.get(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const queryBuilder = new QueryBuilder<KeywordRanking>(delegate, queryConfig);
		const { data, meta } = await queryBuilder.execute(req.query as Record<string, unknown>);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Keyword rankings retrieved successfully.", data, meta });
	}),
);

router.get(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const record = await assertExists(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Keyword ranking retrieved successfully.", data: record });
	}),
);

router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await updateRecord(req.params.id as string, req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Keyword ranking updated successfully.", data: record });
	}),
);

router.delete(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		await deleteRecord(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Keyword ranking deleted successfully.", data: null });
	}),
);

export const keywordRankingRoutes = router;