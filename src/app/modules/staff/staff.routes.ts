import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as staffController from "./staff.controller";
import { createStaffValidation, updateStaffStatusValidation, updateStaffValidation } from "./staff.validation";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN"), validateRequest(createStaffValidation), staffController.createStaff);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), staffController.getAllStaff);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), staffController.getStaffById);
router.patch("/:id", requireAuth, requireRole("ADMIN"), validateRequest(updateStaffValidation), staffController.updateStaff);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN"),
	validateRequest(updateStaffStatusValidation),
	staffController.updateStaffStatus,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), staffController.deleteStaff);

export const staffRoutes = router;
