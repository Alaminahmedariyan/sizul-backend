import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as settingController from "./siteSetting.controller";
import { upsertSiteSettingValidation } from "./siteSetting.validation";

const router = Router();

// Admin-only. Kept private by default since a settings table can hold anything
// (including values not meant for public consumption) — expose specific keys
// through a dedicated public endpoint later if the frontend needs them.
router.put("/", requireAuth, requireRole("ADMIN"), validateRequest(upsertSiteSettingValidation), settingController.upsertSiteSetting);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), settingController.getAllSiteSettings);
router.get("/:key", requireAuth, requireRole("ADMIN", "STAFF"), settingController.getSiteSettingByKey);
router.delete("/:key", requireAuth, requireRole("ADMIN"), settingController.deleteSiteSetting);

export const siteSettingRoutes = router;