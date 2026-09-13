import type { QueryConfig } from "../../queryBuilder";

export const consultationQueryConfig: QueryConfig = {
	filterableFields: {
		leadId: "string",
		serviceId: "string",
		assignedStaffId: "string",
		status: {
			type: "enum",
			enum: { PENDING: "PENDING", CONFIRMED: "CONFIRMED", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED", NO_SHOW: "NO_SHOW" },
		},
		preferredDate: "date",
	},
	sortableFields: ["createdAt", "updatedAt", "preferredDate"],
	includableRelations: ["lead", "service", "assignedStaff"],
};
