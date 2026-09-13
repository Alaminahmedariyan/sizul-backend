import { z } from "zod";

const leadSourceEnum = z.enum(["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "EMAIL_CAMPAIGN", "PHONE", "WALK_IN", "OTHER"]);
const leadPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const leadStatusEnum = z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATING", "CONVERTED", "LOST"]);

// Public-facing — website contact/lead-capture form. No status/priority/assignment:
// those are internal pipeline fields an anonymous visitor must never be able to set.
export const createLeadValidation = z.object({
	serviceId: z.string().min(1).optional(),
	name: z.string().min(1, "Name is required.").max(150),
	email: z.string().email("A valid email is required."),
	phone: z.string().min(1).optional(),
	company: z.string().min(1).optional(),
	website: z.string().url().optional(),
	location: z.string().min(1).optional(),
	budget: z.string().min(1).optional(),
	timeline: z.string().min(1).optional(),
	message: z.string().max(3000).optional(),
	source: leadSourceEnum.default("WEBSITE"),
});

export const updateLeadValidation = z
	.object({
		serviceId: z.string().min(1).nullable().optional(),
		name: z.string().min(1).max(150).optional(),
		email: z.string().email().optional(),
		phone: z.string().min(1).nullable().optional(),
		company: z.string().min(1).nullable().optional(),
		website: z.string().url().nullable().optional(),
		location: z.string().min(1).nullable().optional(),
		budget: z.string().min(1).nullable().optional(),
		timeline: z.string().min(1).nullable().optional(),
		message: z.string().max(3000).nullable().optional(),
		priority: leadPriorityEnum.optional(),
		followUpAt: z.coerce.date().nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updateLeadStatusValidation = z.object({
	status: leadStatusEnum,
});

export const assignLeadValidation = z.object({
	staffId: z.string().min(1).nullable(),
});

export const addLeadNoteValidation = z.object({
	content: z.string().min(1, "Note content is required.").max(5000),
});
