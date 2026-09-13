import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { publicRateLimiter } from "../../middlewares/rateLimiters";
import * as messageController from "./contactMessage.controller";
import { createContactMessageValidation, updateContactMessageStatusValidation } from "./contactMessage.validation";

const router = Router();

// Public — website contact form, rate-limited (no auth, same reasoning as leads)
router.post("/", publicRateLimiter, validateRequest(createContactMessageValidation), messageController.createContactMessage);

router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), messageController.getAllContactMessages);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), messageController.getContactMessageById);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateContactMessageStatusValidation),
	messageController.updateContactMessageStatus,
);
router.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), messageController.deleteContactMessage);

export const contactMessageRoutes = router;