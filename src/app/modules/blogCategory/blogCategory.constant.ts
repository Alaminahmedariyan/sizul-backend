import type { QueryConfig } from "../../queryBuilder";

export const blogCategoryQueryConfig: QueryConfig = {
	searchableFields: ["name", "description"],
	filterableFields: { slug: "string", isActive: "boolean" },
	sortableFields: ["name", "createdAt"],
	includableRelations: ["posts"],
};
