import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as taskController from "./projectTask.controller";
import { createTaskValidation, updateTaskStatusValidation, updateTaskValidation } from "./projectTask.validation";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(createTaskValidation), taskController.createTask);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), taskController.getAllTasks);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), taskController.getTaskById);
router.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateTaskValidation), taskController.updateTask);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateTaskStatusValidation),
	taskController.updateTaskStatus,
);
router.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), taskController.deleteTask);

export const projectTaskRoutes = router;
