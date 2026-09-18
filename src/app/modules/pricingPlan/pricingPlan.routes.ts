import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { createPricingPlanValidation, updatePricingPlanValidation } from "./pricingPlan.validation";
import { pricingPlanController } from "./pricingPlan.controller";

const router = Router();

// Public — e.g. GET /api/v1/pricing-plans?serviceId=xxxx
router.get("/", pricingPlanController.getAllPricingPlansPublic);

router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), pricingPlanController.getAllPricingPlansAdmin);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), pricingPlanController.getPricingPlanById);

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN"),
	validateRequest(createPricingPlanValidation),
	pricingPlanController.createPricingPlan,
);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN"),
	validateRequest(updatePricingPlanValidation),
	pricingPlanController.updatePricingPlan,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), pricingPlanController.deletePricingPlan);

export const pricingPlanRoutes = router;
