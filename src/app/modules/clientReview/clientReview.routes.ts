import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as reviewController from "./clientReview.controller";
import { createClientReviewValidation, updateReviewApprovalValidation, updateReviewFeaturedValidation } from "./clientReview.validation";

const router = Router();

// Public — approved reviews only (site testimonial wall)
router.get("/", reviewController.getAllClientReviewsPublic);

// Client self-service — submit a review for their own project
router.post(
	"/me",
	requireAuth,
	requireRole("CLIENT"),
	validateRequest(createClientReviewValidation),
	reviewController.createMyClientReview,
);

// Admin/Staff moderation
router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), reviewController.getAllClientReviewsAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), reviewController.getClientReviewById);
router.patch(
	"/:id/approval",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateReviewApprovalValidation),
	reviewController.updateReviewApproval,
);
router.patch(
	"/:id/featured",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateReviewFeaturedValidation),
	reviewController.updateReviewFeatured,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), reviewController.deleteClientReview);

export const clientReviewRoutes = router;
