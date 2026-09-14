import { StatusCodes } from "http-status-codes";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate, QueryConfig } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { CallLog } from "../../../generated/prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { assertProjectExists } from "./seo.utils";

const callStatusEnum = z.enum(["COMPLETED", "MISSED", "VOICEMAIL"]);

// Typically written by a Twilio webhook rather than a human form, but validated
// the same way regardless of caller.
const createValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	twilioCallSid: z.string().min(1).optional(),
	fromNumber: z.string().min(1, "fromNumber is required."),
	toNumber: z.string().min(1).optional(),
	duration: z.coerce.number().int().min(0).optional(),
	recordingUrl: z.string().url().optional(),
	status: callStatusEnum.default("COMPLETED"),
});

const queryConfig: QueryConfig = {
	filterableFields: {
		projectId: "string",
		fromNumber: "string",
		status: { type: "enum", enum: { COMPLETED: "COMPLETED", MISSED: "MISSED", VOICEMAIL: "VOICEMAIL" } },
	},
	sortableFields: ["receivedAt", "createdAt", "duration"],
	defaultSortField: "receivedAt",
};

const delegate = prisma.callLog as unknown as PrismaDelegate<CallLog>;

const assertExists = async (id: string) => {
	const record = await prisma.callLog.findUnique({ where: { id } });
	if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Call log not found.");
	return record;
};

const createRecord = async (payload: z.infer<typeof createValidation>) => {
	await assertProjectExists(payload.projectId);
	return prisma.callLog.create({ data: payload as Prisma.CallLogUncheckedCreateInput });
};

const deleteRecord = async (id: string) => {
	await assertExists(id);
	await prisma.callLog.delete({ where: { id } });
};

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createValidation),
	catchAsync(async (req: Request, res: Response) => {
		const record = await createRecord(req.body);
		sendResponse(res, { success: true, statusCode: StatusCodes.CREATED, message: "Call log recorded successfully.", data: record });
	}),
);

router.get(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const queryBuilder = new QueryBuilder<CallLog>(delegate, queryConfig);
		const { data, meta } = await queryBuilder.execute(req.query as Record<string, unknown>);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Call logs retrieved successfully.", data, meta });
	}),
);

router.get(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		const record = await assertExists(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Call log retrieved successfully.", data: record });
	}),
);

router.delete(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	catchAsync(async (req: Request, res: Response) => {
		await deleteRecord(req.params.id as string);
		sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Call log deleted successfully.", data: null });
	}),
);

export const callLogRoutes = router;