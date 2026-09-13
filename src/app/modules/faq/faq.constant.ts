import type { QueryConfig } from "../../queryBuilder";

export const faqQueryConfig: QueryConfig = {
	searchableFields: ["question", "answer"],
	filterableFields: {
		category: "string",
		isActive: "boolean",
	},
	sortableFields: ["order", "createdAt"],
};
