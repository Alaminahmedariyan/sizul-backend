import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import {
	updateMeValidation,
	updateUserRoleValidation,
	updateUserStatusValidation,
} from "./user.validation";
import { userController } from "./user.controller";

const router = Router();

// ============================================================
// Self-service — any authenticated user
// ============================================================
router.get("/me", requireAuth, userController.getMe);
router.patch(
	"/me",
	requireAuth,
	validateRequest(updateMeValidation),
	userController.updateMe,
);

// ============================================================
// Admin-only user management
// ============================================================
router.get("/", requireAuth, requireRole("ADMIN"), userController.getAllUsers);
router.get("/:id", requireAuth, requireRole("ADMIN"), userController.getUserById);
router.patch(
	"/:id/role",
	requireAuth,
	requireRole("ADMIN"),
	validateRequest(updateUserRoleValidation),
	userController.updateUserRole,
);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN"),
	validateRequest(updateUserStatusValidation),
	userController.updateUserStatus,
);

export const userRoutes = router;