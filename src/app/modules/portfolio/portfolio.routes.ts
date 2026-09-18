import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import {
	addPortfolioImageValidation,
	createPortfolioValidation,
	linkPortfolioServiceValidation,
	updatePortfolioStatusValidation,
	updatePortfolioValidation,
} from "./portfolio.validation";
import { portfolioController } from "./portfolio.controller";

const router = Router();

// Public
router.get("/", portfolioController.getAllPortfoliosPublic);

// Admin listing/detail — before the public "/:slug" catch-all
router.get("/manage", requireAuth, requireRole("ADMIN", "STAFF"), portfolioController.getAllPortfoliosAdmin);
router.get("/manage/:id", requireAuth, requireRole("ADMIN", "STAFF"), portfolioController.getPortfolioByIdAdmin);

// Public detail by slug
router.get("/:slug", portfolioController.getPortfolioBySlugPublic);

// Admin mutations
router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createPortfolioValidation),
	portfolioController.createPortfolio,
);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updatePortfolioValidation),
	portfolioController.updatePortfolio,
);
router.patch(
	"/:id/status",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updatePortfolioStatusValidation),
	portfolioController.updatePortfolioStatus,
);

router.post(
	"/:id/images",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(addPortfolioImageValidation),
	portfolioController.addPortfolioImage,
);
router.delete("/images/:imageId", requireAuth, requireRole("ADMIN", "STAFF"), portfolioController.removePortfolioImage);

router.post(
	"/:id/services",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(linkPortfolioServiceValidation),
	portfolioController.linkPortfolioService,
);
router.delete("/:id/services/:serviceId", requireAuth, requireRole("ADMIN", "STAFF"), portfolioController.unlinkPortfolioService);

router.delete("/:id", requireAuth, requireRole("ADMIN"), portfolioController.deletePortfolio);

export const portfolioRoutes = router;