import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import { createBlogCategoryValidation, updateBlogCategoryValidation } from "./blogCategory.validation";
import { blogCategoryController } from "./blogCategory.controller";

const router = Router();

router.get("/", blogCategoryController.getAllBlogCategoriesPublic);
router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), blogCategoryController.getAllBlogCategoriesAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), blogCategoryController.getBlogCategoryById);
router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createBlogCategoryValidation),
	blogCategoryController.createBlogCategory,
);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateBlogCategoryValidation),
	blogCategoryController.updateBlogCategory,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), blogCategoryController.deleteBlogCategory);

export const blogCategoryRoutes = router;
