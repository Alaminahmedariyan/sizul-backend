import { z } from "zod";

const consultationStatusEnum = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]);

export const createConsultationValidation = z.object({
	leadId: z.string().min(1, "leadId is required."),
	serviceId: z.string().min(1).optional(),
	preferredDate: z.coerce.date().optional(),
	preferredTime: z.string().min(1).optional(),
	notes: z.string().max(2000).optional(),
});

export const updateConsultationValidation = z
	.object({
		serviceId: z.string().min(1).nullable().optional(),
		preferredDate: z.coerce.date().nullable().optional(),
		preferredTime: z.string().min(1).nullable().optional(),
		notes: z.string().max(2000).nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updateConsultationStatusValidation = z.object({
	status: consultationStatusEnum,
});

export const assignConsultationValidation = z.object({
	staffId: z.string().min(1).nullable(),
});
