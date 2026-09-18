import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { createMilestoneValidation, updateMilestoneStatusValidation, updateMilestoneValidation } from "./projectMilestone.validation";
import { projectMilestoneController } from "./projectMilestone.controller";

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createMilestoneValidation),
	projectMilestoneController.createMilestone,
);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), projectMilestoneController.getAllMilestones);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectMilestoneController.getMilestoneById);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateMilestoneValidation),
	projectMilestoneController.updateMilestone,
);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateMilestoneStatusValidation),
	projectMilestoneController.updateMilestoneStatus,
);
router.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectMilestoneController.deleteMilestone);

export const projectMilestoneRoutes = router;
