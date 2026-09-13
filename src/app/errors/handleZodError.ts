import { StatusCodes } from "http-status-codes";
import type { ZodError } from "zod";

export const handleZodError = (error: ZodError) => {
	return {
		statusCode: StatusCodes.BAD_REQUEST,
		message: "Validation failed",
		details: error.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		})),
	};
};