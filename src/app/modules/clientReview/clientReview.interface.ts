// Shared request/DTO shapes for the clientReview module.

export type CreateReviewInput = {
	projectId?: string;
	rating: number;
	title?: string;
	content: string;
	serviceQuality?: number;
	communication?: number;
	delivery?: number;
};