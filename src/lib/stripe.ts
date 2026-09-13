import Stripe from "stripe";

import config from "../app/config";

/**
 * Stripe client instance.
 *
 * - `null` if STRIPE_SECRET_KEY is not set in .env (keeps the server bootable
 *   even when Stripe isn't configured yet — useful for templates / early dev).
 * - Becomes a real Stripe instance automatically once STRIPE_SECRET_KEY is set.
 *
 * Don't use this export directly in services — use `getStripe()` instead,
 * it throws a clear error if Stripe isn't configured.
 */
export const stripe: Stripe | null = config.stripe.secretKey
	? new Stripe(config.stripe.secretKey)
	: null;

export const getStripe = (): Stripe => {
	if (!stripe) {
		throw new Error(
			"Stripe is not configured. Set STRIPE_SECRET_KEY in your .env file.",
		);
	}

	return stripe;
};