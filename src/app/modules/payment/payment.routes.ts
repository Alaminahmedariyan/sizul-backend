import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as paymentController from "./payment.controller";
import {
	createBkashCheckoutValidation,
	createSslcommerzCheckoutValidation,
	createStripeCheckoutValidation,
} from "./payment.validation";

const router = Router();

// Public callbacks — hit directly by the payment gateway's redirect, never by
// our own frontend, so no requireAuth here.
router.get("/bkash/callback", paymentController.bkashCallback);
router.get("/sslcommerz/callback", paymentController.sslcommerzCallback);
router.post("/sslcommerz/callback", paymentController.sslcommerzCallback);

// Self-service checkout — client pays for their own proposal, or Admin/Staff on their behalf
router.post(
	"/stripe/checkout",
	requireAuth,
	requireRole("ADMIN", "STAFF", "CLIENT"),
	validateRequest(createStripeCheckoutValidation),
	paymentController.createStripeCheckout,
);
router.post(
	"/bkash/checkout",
	requireAuth,
	requireRole("ADMIN", "STAFF", "CLIENT"),
	validateRequest(createBkashCheckoutValidation),
	paymentController.createBkashCheckout,
);
router.post(
	"/sslcommerz/checkout",
	requireAuth,
	requireRole("ADMIN", "STAFF", "CLIENT"),
	validateRequest(createSslcommerzCheckoutValidation),
	paymentController.createSslcommerzCheckout,
);

router.get("/me", requireAuth, requireRole("CLIENT"), paymentController.getMyPayments);

// Admin/Staff management
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), paymentController.getAllPayments);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), paymentController.getPaymentById);
router.post("/:id/refund", requireAuth, requireRole("ADMIN"), paymentController.refundStripePayment);

export const paymentRoutes = router;