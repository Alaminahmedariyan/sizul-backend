import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { createClientReviewValidation, updateReviewApprovalValidation, updateReviewFeaturedValidation } from "./clientReview.validation";
import { clientReviewController } from "./clientReview.controller";

const router = Router();

// Public — approved reviews only (site testimonial wall)
router.get("/", clientReviewController.getAllClientReviewsPublic);

// Client self-service — submit a review for their own project
router.post(
	"/me",
	requireAuth,
	requireRole("CLIENT"),
	validateRequest(createClientReviewValidation),
	clientReviewController.createMyClientReview,
);

// Admin/Staff moderation
router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), clientReviewController.getAllClientReviewsAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), clientReviewController.getClientReviewById);
router.patch(
	"/:id/approval",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateReviewApprovalValidation),
	clientReviewController.updateReviewApproval,
);
router.patch(
	"/:id/featured",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateReviewFeaturedValidation),
	clientReviewController.updateReviewFeatured,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), clientReviewController.deleteClientReview);

export const clientReviewRoutes = router;
