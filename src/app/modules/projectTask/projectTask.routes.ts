import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { createTaskValidation, updateTaskStatusValidation, updateTaskValidation } from "./projectTask.validation";
import { projectTaskController } from "./projectTask.controller";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(createTaskValidation), projectTaskController.createTask);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), projectTaskController.getAllTasks);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectTaskController.getTaskById);
router.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateTaskValidation), projectTaskController.updateTask);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateTaskStatusValidation),
	projectTaskController.updateTaskStatus,
);
router.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectTaskController.deleteTask);

export const projectTaskRoutes = router;
