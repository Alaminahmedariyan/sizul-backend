import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import {
	createCaseStudyValidation,
	linkCaseStudyServiceValidation,
	updateCaseStudyStatusValidation,
	updateCaseStudyValidation,
} from "./caseStudy.validation";
import { caseStudyController } from "./caseStudy.controller";

const router = Router();

router.get("/", caseStudyController.getAllCaseStudiesPublic);

router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), caseStudyController.getAllCaseStudiesAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), caseStudyController.getCaseStudyByIdAdmin);

router.get("/:slug", caseStudyController.getCaseStudyBySlugPublic);

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createCaseStudyValidation),
	caseStudyController.createCaseStudy,
);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateCaseStudyValidation),
	caseStudyController.updateCaseStudy,
);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateCaseStudyStatusValidation),
	caseStudyController.updateCaseStudyStatus,
);

router.post(
	"/:id/services",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(linkCaseStudyServiceValidation),
	caseStudyController.linkCaseStudyService,
);
router.delete("/:id/services/:serviceId", requireAuth, requireRole("ADMIN", "STAFF"), caseStudyController.unlinkCaseStudyService);

router.delete("/:id", requireAuth, requireRole("ADMIN"), caseStudyController.deleteCaseStudy);

export const caseStudyRoutes = router;
