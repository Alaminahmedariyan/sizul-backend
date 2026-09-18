// Shared request/DTO shapes for the service module.

export type CreateServiceInput = {
	slug: string;
	name: string;
	shortName?: string;
	tagline?: string;
	description?: string;
	icon?: string;
	coverImage?: string;
	features?: unknown;
	process?: unknown;
	startingPrice?: number;
	currency: string;
	isActive: boolean;
	isFeatured: boolean;
	order: number;
	seoTitle?: string;
	seoDescription?: string;
};

export type UpdateServiceInput = Partial<Omit<CreateServiceInput, "currency" | "isActive" | "isFeatured" | "order">> & {
	currency?: string;
	isActive?: boolean;
	isFeatured?: boolean;
	order?: number;
};