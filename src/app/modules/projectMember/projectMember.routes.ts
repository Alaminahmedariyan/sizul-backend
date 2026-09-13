import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as projectMemberController from "./projectMember.controller";
import { addProjectMemberValidation, updateProjectMemberRoleValidation } from "./projectMember.validation";

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(addProjectMemberValidation),
	projectMemberController.addProjectMember,
);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), projectMemberController.getAllProjectMembers);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectMemberController.getProjectMemberById);
router.patch(
	"/:id/role",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateProjectMemberRoleValidation),
	projectMemberController.updateProjectMemberRole,
);
router.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectMemberController.removeProjectMember);

export const projectMemberRoutes = router;
