import type { QueryConfig } from "../../queryBuilder";

export const contactMessageQueryConfig: QueryConfig = {
	searchableFields: ["name", "email", "company", "subject", "message"],
	filterableFields: {
		email: "string",
		status: { type: "enum", enum: { UNREAD: "UNREAD", READ: "READ", REPLIED: "REPLIED", ARCHIVED: "ARCHIVED", SPAM: "SPAM" } },
	},
	sortableFields: ["createdAt"],
	defaultSortField: "createdAt",
};