import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { createServiceValidation, updateServiceValidation } from "./service.validation";
import { serviceController } from "./service.controller";

const router = Router();

// Public
router.get("/", serviceController.getAllServicesPublic);

// Admin listing/detail — registered BEFORE the public "/:slug" route below,
// since Express matches routes in registration order and "/manage" would
// otherwise be swallowed by "/:slug".
router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), serviceController.getAllServicesAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), serviceController.getServiceByIdAdmin);

// Public detail by slug
router.get("/:slug", serviceController.getServiceBySlugPublic);

// Admin mutations
router.post("/", requireAuth, requireRole("ADMIN"), validateRequest(createServiceValidation), serviceController.createService);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN"),
	validateRequest(updateServiceValidation),
	serviceController.updateService,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), serviceController.deleteService);

export const serviceRoutes = router;
