import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import {
	assignConsultationValidation,
	createConsultationValidation,
	updateConsultationStatusValidation,
	updateConsultationValidation,
} from "./consultation.validation";
import { consultationController } from "./consultation.controller";

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createConsultationValidation),
	consultationController.createConsultation,
);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), consultationController.getAllConsultations);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), consultationController.getConsultationById);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateConsultationValidation),
	consultationController.updateConsultation,
);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateConsultationStatusValidation),
	consultationController.updateConsultationStatus,
);
router.patch(
	"/:id/assign",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(assignConsultationValidation),
	consultationController.assignConsultation,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), consultationController.deleteConsultation);

export const consultationRoutes = router;
