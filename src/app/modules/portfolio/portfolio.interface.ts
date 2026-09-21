// Shared request/DTO shapes for the portfolio module.

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CreatePortfolioInput = {
	title: string;
	slug: string;
	clientName?: string;
	industry?: string;
	location?: string;
	websiteUrl?: string;
	coverImage?: string;
	description?: string;
	technologies?: unknown;
	duration?: string;
	results?: unknown;
	seoTitle?: string;
	seoDescription?: string;
	isFeatured: boolean;
};
export type UpdatePortfolioInput = Partial<Omit<CreatePortfolioInput, "isFeatured">> & { isFeatured?: boolean };

export type AddPortfolioImageInput = {
	altText?: string;
	caption?: string;
	order: number;
};