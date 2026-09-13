import { StatusCodes } from "http-status-codes";
import { Prisma } from "../../generated/prisma/client.js";

type TPrismaError = {
	statusCode: number;
	message: string;
	errorCode?: string;
};

export const handlePrismaError = (error: unknown): TPrismaError | null => {
	if (error instanceof Prisma.PrismaClientValidationError) {
		return {
			statusCode: StatusCodes.BAD_REQUEST,
			message: "Invalid request data.",
			errorCode: "PRISMA_VALIDATION_ERROR",
		};
	}

	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		switch (error.code) {
			case "P2002":
				return { statusCode: StatusCodes.CONFLICT, message: "Resource already exists.", errorCode: error.code };
			case "P2003":
				return { statusCode: StatusCodes.BAD_REQUEST, message: "Foreign key constraint failed.", errorCode: error.code };
			case "P2025":
				return { statusCode: StatusCodes.NOT_FOUND, message: "Resource not found.", errorCode: error.code };
			default:
				return { statusCode: StatusCodes.BAD_REQUEST, message: "Database request failed.", errorCode: error.code };
		}
	}

	if (error instanceof Prisma.PrismaClientInitializationError) {
		// P1000 (bad DB credentials) and P1001 (can't reach DB server) get
		// their own status codes — this is Project 2's addition, kept here
		// because it makes debugging deploy issues much faster.
		if (error.errorCode === "P1000") {
			return { statusCode: StatusCodes.UNAUTHORIZED, message: "Database authentication failed.", errorCode: "P1000" };
		}
		if (error.errorCode === "P1001") {
			return { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: "Can't reach database server.", errorCode: "P1001" };
		}
		return { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: "Database connection failed.", errorCode: error.errorCode ?? "PRISMA_INIT_ERROR" };
	}

	if (error instanceof Prisma.PrismaClientUnknownRequestError) {
		return { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: "Database query failed.", errorCode: "PRISMA_UNKNOWN_ERROR" };
	}

	return null;
};