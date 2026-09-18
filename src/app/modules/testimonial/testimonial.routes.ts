import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { createTestimonialValidation, updateTestimonialStatusValidation, updateTestimonialValidation } from "./testimonial.validation";
import { testimonialController } from "./testimonial.controller";

const router = Router();

router.get("/", testimonialController.getAllTestimonialsPublic);

router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), testimonialController.getAllTestimonialsAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), testimonialController.getTestimonialById);

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createTestimonialValidation),
	testimonialController.createTestimonial,
);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateTestimonialValidation),
	testimonialController.updateTestimonial,
);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateTestimonialStatusValidation),
	testimonialController.updateTestimonialStatus,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), testimonialController.deleteTestimonial);

export const testimonialRoutes = router;
