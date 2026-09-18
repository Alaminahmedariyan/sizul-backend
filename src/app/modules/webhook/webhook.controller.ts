import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type Stripe from "stripe";

import config from "../../config";
import { getStripe } from "../../../lib/stripe";
import { catchAsync } from "../../utils/catchAsync";
import { markPaymentFailedByProviderIdInDB, markPaymentSucceededByProviderIdInDB } from "../payment/payment.service";

 const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
	const signature = req.headers["stripe-signature"];

	if (!config.stripe.webhookSecret || !signature) {
		res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Stripe webhook is not configured." });
		return;
	}

	let event: Stripe.Event;

	try {
		// req.body is a raw Buffer here (see webhook.routes.ts's express.raw()
		// middleware) — Stripe's signature check requires the untouched raw bytes,
		// not a parsed JSON object.
		event = getStripe().webhooks.constructEvent(req.body as Buffer, signature, config.stripe.webhookSecret);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Invalid signature.";
		res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Webhook signature verification failed: ${message}` });
		return;
	}

	switch (event.type) {
		case "checkout.session.completed": {
			const session = event.data.object as Stripe.Checkout.Session;
			await markPaymentSucceededByProviderIdInDB(session.id);
			break;
		}
		case "checkout.session.expired": {
			const session = event.data.object as Stripe.Checkout.Session;
			await markPaymentFailedByProviderIdInDB(session.id, "Checkout session expired.");
			break;
		}
		case "payment_intent.payment_failed": {
			const intent = event.data.object as Stripe.PaymentIntent;
			console.warn(`[Stripe Webhook] payment_intent.payment_failed — ${intent.id}`);
			break;
		}
		default:
			console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
	}

	res.status(StatusCodes.OK).json({ received: true });
});

export const webhookController = {
	handleStripeWebhook,
};