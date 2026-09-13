import { z } from "zod";

const staffRoleEnum = z.enum(["OWNER", "MANAGER", "DEVELOPER", "DESIGNER", "MARKETING", "SALES", "SUPPORT"]);
const staffStatusEnum = z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]);

export const createStaffValidation = z.object({
	userId: z.string().min(1).optional(),
	employeeId: z.string().min(1).optional(),
	fullName: z.string().min(1, "Full name is required.").max(150),
	email: z.string().email("A valid email is required."),
	phone: z.string().min(1).optional(),
	role: staffRoleEnum.default("SUPPORT"),
	designation: z.string().min(1).optional(),
	department: z.string().min(1).optional(),
	bio: z.string().max(2000).optional(),
	avatar: z.string().url().optional(),
	hireDate: z.coerce.date().optional(),
});

export const updateStaffValidation = z
	.object({
		userId: z.string().min(1).nullable().optional(),
		employeeId: z.string().min(1).nullable().optional(),
		fullName: z.string().min(1).max(150).optional(),
		email: z.string().email().optional(),
		phone: z.string().min(1).nullable().optional(),
		role: staffRoleEnum.optional(),
		designation: z.string().min(1).nullable().optional(),
		department: z.string().min(1).nullable().optional(),
		bio: z.string().max(2000).nullable().optional(),
		avatar: z.string().url().nullable().optional(),
		hireDate: z.coerce.date().nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updateStaffStatusValidation = z.object({
	status: staffStatusEnum,
});
