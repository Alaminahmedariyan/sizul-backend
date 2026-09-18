import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { addProjectMemberValidation, updateProjectMemberRoleValidation } from "./projectMember.validation";
import { projectMemberController } from "./projectMember.controller";

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
