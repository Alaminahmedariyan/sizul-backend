import type { QueryConfig } from "../../queryBuilder";

export const proposalQueryConfig: QueryConfig = {
	searchableFields: ["title", "proposalNumber"],
	filterableFields: {
		proposalNumber: "string",
		title: "string",
		leadId: "string",
		clientId: "string",
		projectId: "string",
		createdById: "string",
		status: {
			type: "enum",
			enum: { DRAFT: "DRAFT", SENT: "SENT", VIEWED: "VIEWED", ACCEPTED: "ACCEPTED", REJECTED: "REJECTED", EXPIRED: "EXPIRED" },
		},
		validUntil: "date",
	},
	sortableFields: ["createdAt", "updatedAt", "validUntil", "total", "proposalNumber"],
	includableRelations: ["lead", "client", "project", "createdBy", "items"],
	defaultSortField: "createdAt",
};
