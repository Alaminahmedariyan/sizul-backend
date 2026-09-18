// Shared request/DTO shapes for the lead module.

export type LeadActivityType =
	| "CREATED"
	| "UPDATED"
	| "ASSIGNED"
	| "CONTACTED"
	| "EMAIL_SENT"
	| "CALL_MADE"
	| "MEETING_SCHEDULED"
	| "NOTE_ADDED"
	| "STATUS_CHANGED"
	| "PROPOSAL_SENT"
	| "CONVERTED"
	| "LOST";

export type LeadSource = "WEBSITE" | "REFERRAL" | "SOCIAL_MEDIA" | "EMAIL_CAMPAIGN" | "PHONE" | "WALK_IN" | "OTHER";
export type LeadPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL_SENT" | "NEGOTIATING" | "CONVERTED" | "LOST";
export type CreateLeadInput = {
	serviceId?: string;
	name: string;
	email: string;
	phone?: string;
	company?: string;
	website?: string;
	location?: string;
	budget?: string;
	timeline?: string;
	message?: string;
	source: LeadSource;
};
export type UpdateLeadInput = {
	serviceId?: string | null;
	name?: string;
	email?: string;
	phone?: string | null;
	company?: string | null;
	website?: string | null;
	location?: string | null;
	budget?: string | null;
	timeline?: string | null;
	message?: string | null;
	priority?: LeadPriority;
	followUpAt?: Date | null;
};