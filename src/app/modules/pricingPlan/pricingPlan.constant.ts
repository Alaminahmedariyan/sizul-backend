import type { QueryConfig } from "../../queryBuilder";

export const pricingPlanQueryConfig: QueryConfig = {
	searchableFields: ["name", "description"],
	filterableFields: {
		serviceId: "string",
		slug: "string",
		isActive: "boolean",
		isPopular: "boolean",
		billingInterval: {
			type: "enum",
			enum: { ONE_TIME: "ONE_TIME", MONTHLY: "MONTHLY", QUARTERLY: "QUARTERLY", YEARLY: "YEARLY", CUSTOM: "CUSTOM" },
		},
	},
	sortableFields: ["order", "price", "createdAt", "updatedAt", "name"],
	includableRelations: ["service"],
};
