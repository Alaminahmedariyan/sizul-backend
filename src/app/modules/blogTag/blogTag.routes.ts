import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { createBlogTagValidation, updateBlogTagValidation } from "./blogTag.validation";
import { blogTagController } from "./blogTag.controller";

const router = Router();

// Public — tags are just labels, no draft/active concept, safe to list openly
router.get("/", blogTagController.getAllBlogTags);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), blogTagController.getBlogTagById);
router.post("/", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(createBlogTagValidation), blogTagController.createBlogTag);
router.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateBlogTagValidation), blogTagController.updateBlogTag);
router.delete("/:id", requireAuth, requireRole("ADMIN"), blogTagController.deleteBlogTag);

export const blogTagRoutes = router;
