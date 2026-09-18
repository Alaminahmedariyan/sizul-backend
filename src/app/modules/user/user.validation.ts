import { z } from "zod";

export const updateMeValidation = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name too long.").optional(),
		image: z.string().url("Image must be a valid URL.").optional(),
	})
	.strict() // reject unknown fields
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field (name or image) must be provided." });

export const updateUserRoleValidation = z.object({
	role: z.enum(["ADMIN", "STAFF", "CLIENT"], { message: "Role must be ADMIN, STAFF, or CLIENT." }),
});

export const updateUserStatusValidation = z.object({
	status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"], { message: "Status must be ACTIVE, INACTIVE, or SUSPENDED." }),
});

export const userValidations = {
	updateMeValidation,
	updateUserRoleValidation,
	updateUserStatusValidation,
};