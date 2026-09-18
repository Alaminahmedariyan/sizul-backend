import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { createNotificationValidation } from "./notification.validation";
import { notificationController } from "./notification.controller";

const router = Router();

// Self-service — any authenticated user manages their own notifications
router.get("/me", requireAuth, notificationController.getMyNotifications);
router.patch("/me/read-all", requireAuth, notificationController.markAllNotificationsRead);
router.patch("/:id/read", requireAuth, notificationController.markNotificationRead);
router.delete("/:id", requireAuth, notificationController.deleteMyNotification);

// Admin-only manual creation (see the note in notification.validation.ts)
router.post(
	"/",
	requireAuth,
	requireRole("ADMIN"),
	validateRequest(createNotificationValidation),
	notificationController.createNotification,
);

export const notificationRoutes = router;