import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { upsertSiteSettingValidation } from "./siteSetting.validation";
import { siteSettingController } from "./siteSetting.controller";

const router = Router();

// Admin-only. Kept private by default since a settings table can hold anything
// (including values not meant for public consumption) — expose specific keys
// through a dedicated public endpoint later if the frontend needs them.
router.put("/", requireAuth, requireRole("ADMIN"), validateRequest(upsertSiteSettingValidation), siteSettingController.upsertSiteSetting);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), siteSettingController.getAllSiteSettings);
router.get("/:key", requireAuth, requireRole("ADMIN", "STAFF"), siteSettingController.getSiteSettingByKey);
router.delete("/:key", requireAuth, requireRole("ADMIN"), siteSettingController.deleteSiteSetting);

export const siteSettingRoutes = router;