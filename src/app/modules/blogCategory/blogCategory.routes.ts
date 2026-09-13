import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as categoryController from "./blogCategory.controller";
import { createBlogCategoryValidation, updateBlogCategoryValidation } from "./blogCategory.validation";

const router = Router();

router.get("/", categoryController.getAllBlogCategoriesPublic);
router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), categoryController.getAllBlogCategoriesAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), categoryController.getBlogCategoryById);
router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createBlogCategoryValidation),
	categoryController.createBlogCategory,
);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateBlogCategoryValidation),
	categoryController.updateBlogCategory,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), categoryController.deleteBlogCategory);

export const blogCategoryRoutes = router;
