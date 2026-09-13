import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
// ADJUST THIS PATH if your multer middleware file lives somewhere else (same
// note as projectFile.routes.ts):
import { documentUpload } from "../../middlewares/upload";
import * as mediaController from "./media.controller";
import { updateMediaValidation, uploadMediaValidation } from "./media.validation";

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	documentUpload.single("file"),
	validateRequest(uploadMediaValidation),
	mediaController.uploadMedia,
);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), mediaController.getAllMedia);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), mediaController.getMediaById);
router.patch("/:id", requireAuth, requireRole("ADMIN", "STAFF"), validateRequest(updateMediaValidation), mediaController.updateMedia);
router.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), mediaController.deleteMedia);

export const mediaRoutes = router;
