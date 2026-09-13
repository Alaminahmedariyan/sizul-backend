import type { QueryConfig } from "../../queryBuilder";

export const clientAppreciationQueryConfig: QueryConfig = {
	searchableFields: ["title", "description"],
	filterableFields: {
		clientId: "string",
		projectId: "string",
		type: {
			type: "enum",
			enum: {
				THANK_YOU_NOTE: "THANK_YOU_NOTE",
				GIFT: "GIFT",
				REFERRAL: "REFERRAL",
				BONUS: "BONUS",
				TESTIMONIAL: "TESTIMONIAL",
				OTHER: "OTHER",
			},
		},
		receivedAt: "date",
	},
	sortableFields: ["createdAt", "receivedAt"],
	includableRelations: ["client", "project"],
	defaultSortField: "receivedAt",
};
