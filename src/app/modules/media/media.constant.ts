import type { QueryConfig } from "../../queryBuilder";

export const mediaQueryConfig: QueryConfig = {
	searchableFields: ["fileName", "altText", "caption"],
	filterableFields: {
		category: { type: "enum", enum: { IMAGE: "IMAGE", VIDEO: "VIDEO", DOCUMENT: "DOCUMENT", AUDIO: "AUDIO", OTHER: "OTHER" } },
	},
	sortableFields: ["createdAt", "fileName", "size"],
	defaultSortField: "createdAt",
};
