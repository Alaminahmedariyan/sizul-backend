import type { QueryConfig } from "../../queryBuilder";

export const notificationQueryConfig: QueryConfig = {
	filterableFields: {
		isRead: "boolean",
		type: {
			type: "enum",
			enum: {
				LEAD_NEW: "LEAD_NEW",
				LEAD_ASSIGNED: "LEAD_ASSIGNED",
				LEAD_STATUS_CHANGED: "LEAD_STATUS_CHANGED",
				PROPOSAL_SENT: "PROPOSAL_SENT",
				PROPOSAL_ACCEPTED: "PROPOSAL_ACCEPTED",
				PROPOSAL_REJECTED: "PROPOSAL_REJECTED",
				PROJECT_UPDATE: "PROJECT_UPDATE",
				TASK_ASSIGNED: "TASK_ASSIGNED",
				TASK_DUE: "TASK_DUE",
				CONSULTATION_SCHEDULED: "CONSULTATION_SCHEDULED",
				MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
				REVIEW_RECEIVED: "REVIEW_RECEIVED",
				SEO_REPORT: "SEO_REPORT",
				SYSTEM: "SYSTEM",
			},
		},
	},
	sortableFields: ["createdAt"],
	defaultSortField: "createdAt",
};