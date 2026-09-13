import type { QueryConfig } from "../../queryBuilder";

export const blogTagQueryConfig: QueryConfig = {
	searchableFields: ["name"],
	filterableFields: { slug: "string" },
	sortableFields: ["name", "createdAt"],
};
