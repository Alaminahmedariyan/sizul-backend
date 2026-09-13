import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as postController from "./blogPost.controller";
import { createBlogPostValidation, updateBlogPostStatusValidation, updateBlogPostValidation } from "./blogPost.validation";

const router = Router();

router.get("/", postController.getAllBlogPostsPublic);

router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), postController.getAllBlogPostsAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), postController.getBlogPostByIdAdmin);

router.get("/:slug", postController.getBlogPostBySlugPublic);

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createBlogPostValidation),
	postController.createBlogPost,
);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateBlogPostValidation),
	postController.updateBlogPost,
);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateBlogPostStatusValidation),
	postController.updateBlogPostStatus,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), postController.deleteBlogPost);

export const blogPostRoutes = router;
