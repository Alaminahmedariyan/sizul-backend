import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as appreciationController from "./clientAppreciation.controller";
import { createAppreciationValidation, updateAppreciationValidation } from "./clientAppreciation.validation";

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createAppreciationValidation),
	appreciationController.createAppreciation,
);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), appreciationController.getAllAppreciations);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), appreciationController.getAppreciationById);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateAppreciationValidation),
	appreciationController.updateAppreciation,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), appreciationController.deleteAppreciation);

export const clientAppreciationRoutes = router;
