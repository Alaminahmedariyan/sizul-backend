import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { publicRateLimiter } from "../../middlewares/rateLimiters";
import * as leadController from "./lead.controller";
import {
	addLeadNoteValidation,
	assignLeadValidation,
	createLeadValidation,
	updateLeadStatusValidation,
	updateLeadValidation,
} from "./lead.validation";

const router = Router();

// Public — website contact/lead-capture form. Extra rate limiting on top of the
// global limiter since this is the one write endpoint reachable with no auth at all.
router.post("/", publicRateLimiter, validateRequest(createLeadValidation), leadController.createLead);

// Admin/Staff pipeline management
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), leadController.getAllLeads);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), leadController.getLeadById);
router.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateLeadValidation), leadController.updateLead);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateLeadStatusValidation),
	leadController.updateLeadStatus,
);
router.patch(
	"/:id/assign",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(assignLeadValidation),
	leadController.assignLead,
);
router.post("/:id/convert", requireAuth, requireRole("ADMIN", "STAFF"), leadController.convertLeadToClient);

router.get("/:id/notes", requireAuth, requireRole("ADMIN", "STAFF"), leadController.getLeadNotes);
router.post(
	"/:id/notes",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(addLeadNoteValidation),
	leadController.addLeadNote,
);

router.get("/:id/activities", requireAuth, requireRole("ADMIN", "STAFF"), leadController.getLeadActivities);

router.delete("/:id", requireAuth, requireRole("ADMIN"), leadController.deleteLead);

export const leadRoutes = router;
