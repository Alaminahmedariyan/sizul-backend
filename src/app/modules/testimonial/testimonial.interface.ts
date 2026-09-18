// Shared request/DTO shapes for the testimonial module.

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type CreateTestimonialInput = {
	clientName: string;
	clientRole?: string;
	companyName?: string;
	clientImage?: string;
	content: string;
	rating: number;
	serviceName?: string;
	isFeatured: boolean;
};

export type UpdateTestimonialInput = Partial<Omit<CreateTestimonialInput, "isFeatured">> & { isFeatured?: boolean };