import type { QueryConfig } from "../../queryBuilder";

export const paymentQueryConfig: QueryConfig = {
	filterableFields: {
		proposalId: "string",
		clientId: "string",
		provider: { type: "enum", enum: { STRIPE: "STRIPE", BKASH: "BKASH", SSLCOMMERZ: "SSLCOMMERZ", MANUAL: "MANUAL" } },
		status: {
			type: "enum",
			enum: { PENDING: "PENDING", PROCESSING: "PROCESSING", SUCCEEDED: "SUCCEEDED", FAILED: "FAILED", REFUNDED: "REFUNDED", CANCELLED: "CANCELLED" },
		},
	},
	sortableFields: ["createdAt", "paidAt", "amount"],
	includableRelations: ["proposal", "client"],
	defaultSortField: "createdAt",
};