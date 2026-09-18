// Shared request/DTO shapes for the caseStudy module.

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CreateCaseStudyInput = {
	title: string;
	slug: string;
	clientName?: string;
	industry?: string;
	location?: string;
	coverImage?: string;
	problem?: string;
	strategy?: string;
	implementation?: string;
	results?: string;
	metrics?: unknown;
	seoTitle?: string;
	seoDescription?: string;
	isFeatured: boolean;
};
export type UpdateCaseStudyInput = Partial<Omit<CreateCaseStudyInput, "isFeatured">> & { isFeatured?: boolean };