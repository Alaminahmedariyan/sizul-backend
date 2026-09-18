import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { publicRateLimiter } from "../../middlewares/rateLimiters";
import { createContactMessageValidation, updateContactMessageStatusValidation } from "./contactMessage.validation";
import { contactMessageController } from "./contactMessage.controller";

const router = Router();

// Public — website contact form, rate-limited (no auth, same reasoning as leads)
router.post("/", publicRateLimiter, validateRequest(createContactMessageValidation), contactMessageController.createContactMessage);

router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), contactMessageController.getAllContactMessages);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), contactMessageController.getContactMessageById);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateContactMessageStatusValidation),
	contactMessageController.updateContactMessageStatus,
);
router.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), contactMessageController.deleteContactMessage);

export const contactMessageRoutes = router;