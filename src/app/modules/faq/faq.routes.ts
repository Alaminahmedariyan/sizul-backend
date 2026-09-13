import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as faqController from "./faq.controller";
import { createFaqValidation, updateFaqValidation } from "./faq.validation";

const router = Router();

router.get("/", faqController.getAllFaqsPublic);

router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), faqController.getAllFaqsAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), faqController.getFaqById);

router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(createFaqValidation), faqController.createFaq);
router.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateFaqValidation), faqController.updateFaq);
router.delete("/:id", requireAuth, requireRole("ADMIN"), faqController.deleteFaq);

export const faqRoutes = router;
