import { z } from "zod";

// Professional-grade password policy: length + character-class requirements.
// Kept in one place so both the Zod check below and any client-facing
// "password requirements" text stay in sync with each other.
export const passwordPolicy = z
	.string()
	.min(8, "Password must be at least 8 characters.")
	.max(128, "Password must be at most 128 characters.")
	.regex(/[a-z]/, "Password must include at least one lowercase letter.")
	.regex(/[A-Z]/, "Password must include at least one uppercase letter.")
	.regex(/[0-9]/, "Password must include at least one number.")
	.regex(/[^a-zA-Z0-9]/, "Password must include at least one special character.");

export const signUpEmailValidation = z.object({
	name: z
		.string()
		.trim()
		.min(2, "Name must be at least 2 characters.")
		.max(100, "Name must be at most 100 characters."),
	email: z.string().trim().toLowerCase().email("A valid email address is required."),
	password: passwordPolicy,
});

// Sign-in intentionally does NOT re-check password complexity — a user's
// existing password may predate a policy change, and rejecting valid
// credentials at login because they don't meet *today's* rules would lock
// people out of their own accounts. Only shape/presence is checked here.
export const signInEmailValidation = z.object({
	email: z.string().trim().toLowerCase().email("A valid email address is required."),
	password: z.string().min(1, "Password is required."),
});