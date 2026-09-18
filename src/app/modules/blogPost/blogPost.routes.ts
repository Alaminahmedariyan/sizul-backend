import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { createBlogPostValidation, updateBlogPostStatusValidation, updateBlogPostValidation } from "./blogPost.validation";
import { blogPostController } from "./blogPost.controller";

const router = Router();

router.get("/", blogPostController.getAllBlogPostsPublic);

router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), blogPostController.getAllBlogPostsAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), blogPostController.getBlogPostByIdAdmin);

router.get("/:slug", blogPostController.getBlogPostBySlugPublic);

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createBlogPostValidation),
	blogPostController.createBlogPost,
);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateBlogPostValidation),
	blogPostController.updateBlogPost,
);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateBlogPostStatusValidation),
	blogPostController.updateBlogPostStatus,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), blogPostController.deleteBlogPost);

export const blogPostRoutes = router;
