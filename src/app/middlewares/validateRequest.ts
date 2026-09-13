import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { z } from "zod";

import AppError from "../errors/appError";

export const validateRequest = (schema: z.ZodTypeAny) => {
	return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
		const result = await schema.safeParseAsync(req.body ?? {});

		if (!result.success) {
			return next(
				new AppError(
					StatusCodes.BAD_REQUEST,
					result.error.issues[0]?.message ?? "Validation failed.",
					"VALIDATION_ERROR",
					result.error.issues.map((issue) => ({
						field: issue.path.join("."),
						message: issue.message,
					})),
				),
			);
		}

		req.body = result.data;
		next();
	};
};