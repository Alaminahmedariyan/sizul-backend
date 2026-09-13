import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as milestoneController from "./projectMilestone.controller";
import { createMilestoneValidation, updateMilestoneStatusValidation, updateMilestoneValidation } from "./projectMilestone.validation";

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createMilestoneValidation),
	milestoneController.createMilestone,
);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), milestoneController.getAllMilestones);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), milestoneController.getMilestoneById);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateMilestoneValidation),
	milestoneController.updateMilestone,
);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateMilestoneStatusValidation),
	milestoneController.updateMilestoneStatus,
);
router.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), milestoneController.deleteMilestone);

export const projectMilestoneRoutes = router;
