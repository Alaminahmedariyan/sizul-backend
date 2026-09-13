import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as tagController from "./blogTag.controller";
import { createBlogTagValidation, updateBlogTagValidation } from "./blogTag.validation";

const router = Router();

// Public — tags are just labels, no draft/active concept, safe to list openly
router.get("/", tagController.getAllBlogTags);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), tagController.getBlogTagById);
router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(createBlogTagValidation), tagController.createBlogTag);
router.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateBlogTagValidation), tagController.updateBlogTag);
router.delete("/:id", requireAuth, requireRole("ADMIN"), tagController.deleteBlogTag);

export const blogTagRoutes = router;
