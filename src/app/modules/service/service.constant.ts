import type { QueryConfig } from "../../queryBuilder";

export const serviceQueryConfig: QueryConfig = {
	searchableFields: ["name", "shortName", "tagline", "description"],
	filterableFields: {
		slug: "string",
		name: "string",
		isActive: "boolean",
		isFeatured: "boolean",
	},
	sortableFields: ["order", "createdAt", "updatedAt", "name", "startingPrice"],
	includableRelations: ["pricingPlans", "portfolioItems", "caseStudyItems"],
	// No defaultSortField override: QueryBuilder's built-in default-sort always
	// applies "desc", which would be wrong for the "order" column (it should
	// read ascending — 0, 1, 2...). getAllServicesFromDB injects an explicit
	// `sortBy=order&sortOrder=asc` default instead when the caller doesn't sort.
};
