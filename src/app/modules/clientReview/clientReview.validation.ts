import { z } from "zod";

export const createClientReviewValidation = z.object({
	projectId: z.string().min(1).optional(),
	rating: z.coerce.number().int().min(1).max(5).default(5),
	title: z.string().min(1).max(150).optional(),
	content: z.string().min(1, "Review content is required.").max(3000),
	serviceQuality: z.coerce.number().int().min(1).max(5).optional(),
	communication: z.coerce.number().int().min(1).max(5).optional(),
	delivery: z.coerce.number().int().min(1).max(5).optional(),
});

export const updateReviewApprovalValidation = z.object({
	isApproved: z.boolean(),
});

export const updateReviewFeaturedValidation = z.object({
	isFeatured: z.boolean(),
});
