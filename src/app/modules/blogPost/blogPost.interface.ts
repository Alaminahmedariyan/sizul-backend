// Shared request/DTO shapes for the blogPost module.

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CreatePostInput = {
	categoryId?: string;
	title: string;
	slug: string;
	excerpt?: string;
	content: string;
	featuredImage?: string;
	seoTitle?: string;
	seoDescription?: string;
	canonicalUrl?: string;
	schemaMarkup?: unknown;
	tagIds: string[];
};
export type UpdatePostInput = Partial<Omit<CreatePostInput, "tagIds">> & { tagIds?: string[] };