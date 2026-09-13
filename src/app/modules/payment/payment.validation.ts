import { z } from "zod";

export const createStripeCheckoutValidation = z.object({
	proposalId: z.string().min(1, "proposalId is required."),
});

export const createBkashCheckoutValidation = z.object({
	proposalId: z.string().min(1, "proposalId is required."),
});

export const createSslcommerzCheckoutValidation = z.object({
	proposalId: z.string().min(1, "proposalId is required."),
});