import { z } from "zod";

const testimonialStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const createTestimonialValidation = z.object({
	clientName: z.string().min(1, "Client name is required.").max(150),
	clientRole: z.string().min(1).max(100).optional(),
	companyName: z.string().min(1).max(150).optional(),
	clientImage: z.string().url().optional(),
	content: z.string().min(1, "Content is required.").max(2000),
	rating: z.coerce.number().int().min(1).max(5).default(5),
	serviceName: z.string().min(1).max(150).optional(),
	isFeatured: z.boolean().default(false),
});

export const updateTestimonialValidation = z
	.object({
		clientName: z.string().min(1).max(150).optional(),
		clientRole: z.string().min(1).max(100).nullable().optional(),
		companyName: z.string().min(1).max(150).nullable().optional(),
		clientImage: z.string().url().nullable().optional(),
		content: z.string().min(1).max(2000).optional(),
		rating: z.coerce.number().int().min(1).max(5).optional(),
		serviceName: z.string().min(1).max(150).nullable().optional(),
		isFeatured: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });

export const updateTestimonialStatusValidation = z.object({
	status: testimonialStatusEnum,
});
