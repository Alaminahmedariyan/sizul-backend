// Shared request/DTO shapes for the notification module.

export type NotificationType =
	| "LEAD_NEW" | "LEAD_ASSIGNED" | "LEAD_STATUS_CHANGED" | "PROPOSAL_SENT" | "PROPOSAL_ACCEPTED"
	| "PROPOSAL_REJECTED" | "PROJECT_UPDATE" | "TASK_ASSIGNED" | "TASK_DUE" | "CONSULTATION_SCHEDULED"
	| "MESSAGE_RECEIVED" | "REVIEW_RECEIVED" | "SEO_REPORT" | "SYSTEM";

export type NotificationEntityType = "LEAD" | "PROPOSAL" | "PROJECT" | "TASK" | "CONSULTATION" | "MESSAGE" | "REVIEW" | "USER";