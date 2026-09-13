import type { QueryConfig } from "../../queryBuilder";

export const leadQueryConfig: QueryConfig = {
	searchableFields: ["name", "email", "company", "phone"],
	filterableFields: {
		name: "string",
		email: "string",
		company: "string",
		serviceId: "string",
		clientId: "string",
		assignedStaffId: "string",
		status: {
			type: "enum",
			enum: {
				NEW: "NEW",
				CONTACTED: "CONTACTED",
				QUALIFIED: "QUALIFIED",
				PROPOSAL_SENT: "PROPOSAL_SENT",
				NEGOTIATING: "NEGOTIATING",
				CONVERTED: "CONVERTED",
				LOST: "LOST",
			},
		},
		priority: { type: "enum", enum: { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", URGENT: "URGENT" } },
		source: {
			type: "enum",
			enum: {
				WEBSITE: "WEBSITE",
				REFERRAL: "REFERRAL",
				SOCIAL_MEDIA: "SOCIAL_MEDIA",
				EMAIL_CAMPAIGN: "EMAIL_CAMPAIGN",
				PHONE: "PHONE",
				WALK_IN: "WALK_IN",
				OTHER: "OTHER",
			},
		},
	},
	sortableFields: ["createdAt", "updatedAt", "followUpAt", "priority", "name"],
	includableRelations: ["service", "client", "assignedStaff"],
	defaultSortField: "createdAt",
};
