import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as projectController from "./project.controller";
import {
	createProjectValidation,
	updateProjectProgressValidation,
	updateProjectStatusValidation,
	updateProjectValidation,
} from "./project.validation";

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createProjectValidation),
	projectController.createProject,
);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), projectController.getAllProjects);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectController.getProjectById);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateProjectValidation),
	projectController.updateProject,
);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateProjectStatusValidation),
	projectController.updateProjectStatus,
);
router.patch(
	"/:id/progress",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateProjectProgressValidation),
	projectController.updateProjectProgress,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), projectController.deleteProject);

export const projectRoutes = router;
