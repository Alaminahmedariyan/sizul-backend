import type { QueryConfig } from "../../queryBuilder";

export const projectFileQueryConfig: QueryConfig = {
	searchableFields: ["fileName", "description"],
	filterableFields: {
		projectId: "string",
		category: { type: "enum", enum: { IMAGE: "IMAGE", VIDEO: "VIDEO", DOCUMENT: "DOCUMENT", AUDIO: "AUDIO", OTHER: "OTHER" } },
	},
	sortableFields: ["createdAt", "fileName", "size"],
	includableRelations: ["project"],
	defaultSortField: "createdAt",
};
