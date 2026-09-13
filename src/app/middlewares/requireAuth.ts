import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import type { UserRole } from "../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import AppError from "../errors/appError";
import { catchAsync } from "../utils/catchAsync";

export type AuthenticatedUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	role: UserRole;
	createdAt: Date;
	updatedAt: Date;
};

export const requireAuth = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
	const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

	if (!session?.user) {
		throw new AppError(StatusCodes.UNAUTHORIZED, "You are not logged in. Please log in to access this resource.");
	}

	req.user = session.user as unknown as AuthenticatedUser;
	next();
});

export const requireRole = (...roles: UserRole[]) => {
	return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
		if (!req.user) {
			throw new AppError(StatusCodes.UNAUTHORIZED, "You are not logged in.");
		}
		if (roles.length && !roles.includes(req.user.role)) {
			throw new AppError(StatusCodes.FORBIDDEN, "You don't have permission to access this resource.");
		}
		next();
	});
};