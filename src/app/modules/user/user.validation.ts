import { z } from "zod";

export const updateMeValidation = z.object({
	body: z
		.object({
			name: z
				.string()
				.min(2, "Name must be at least 2 characters.")
				.max(100, "Name too long.")
				.optional(),
			image: z.string().url("Image must be a valid URL.").optional(),
		})
		.strict(), // reject unknown fields
});

export const updateUserRoleValidation = z.object({
	body: z.object({
		role: z.enum(["ADMIN", "STAFF", "CLIENT"], {
			message: "Role must be ADMIN, STAFF, or CLIENT.",
		}),
	}),
});

export const updateUserStatusValidation = z.object({
	body: z.object({
		status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"], {
			message: "Status must be ACTIVE, INACTIVE, or SUSPENDED.",
		}),
	}),
});