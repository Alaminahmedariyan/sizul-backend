import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { createStripeCheckoutValidation } from "./payment.validation";
import { paymentController } from "./payment.controller";

const router = Router();

// Self-service checkout — client pays for their own proposal, or Admin/Staff on their behalf
router.post(
	"/stripe/checkout",
	requireAuth,
	requireRole("ADMIN", "STAFF", "CLIENT"),
	validateRequest(createStripeCheckoutValidation),
	paymentController.createStripeCheckout,
);

router.get("/me", requireAuth, requireRole("CLIENT"), paymentController.getMyPayments);

// Admin/Staff management
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), paymentController.getAllPayments);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), paymentController.getPaymentById);
router.post("/:id/refund", requireAuth, requireRole("ADMIN"), paymentController.refundPayment);

export const paymentRoutes = router;