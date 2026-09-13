import { z } from "zod";

const notificationTypeEnum = z.enum([
	"LEAD_NEW", "LEAD_ASSIGNED", "LEAD_STATUS_CHANGED", "PROPOSAL_SENT", "PROPOSAL_ACCEPTED",
	"PROPOSAL_REJECTED", "PROJECT_UPDATE", "TASK_ASSIGNED", "TASK_DUE", "CONSULTATION_SCHEDULED",
	"MESSAGE_RECEIVED", "REVIEW_RECEIVED", "SEO_REPORT", "SYSTEM",
]);
const notificationEntityTypeEnum = z.enum(["LEAD", "PROPOSAL", "PROJECT", "TASK", "CONSULTATION", "MESSAGE", "REVIEW", "USER"]);

// Admin-only manual notification (e.g. system broadcast to one user). Most
// notifications in practice are created internally by other modules' services,
// not through this endpoint.
export const createNotificationValidation = z.object({
	userId: z.string().min(1, "userId is required."),
	type: notificationTypeEnum,
	entityType: notificationEntityTypeEnum.optional(),
	entityId: z.string().min(1).optional(),
	title: z.string().min(1, "Title is required.").max(200),
	message: z.string().min(1, "Message is required.").max(2000),
});