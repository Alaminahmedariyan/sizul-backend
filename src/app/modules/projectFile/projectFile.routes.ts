import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
// ADJUST THIS PATH if your multer middleware file lives somewhere else:
import { documentUpload } from "../../middlewares/upload";

import { uploadProjectFileValidation } from "./projectFile.validation";
import { projectFileController } from "./projectFile.controller";

const router = Router();

// multer runs first so it parses the multipart body (populating req.file and the
// text fields into req.body) — validateRequest only works correctly after that.
router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	documentUpload.single("file"),
	validateRequest(uploadProjectFileValidation),
	projectFileController.uploadProjectFile,
);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), projectFileController.getAllProjectFiles);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectFileController.getProjectFileById);
router.delete("/:id", requireAuth, requireRole("ADMIN", "STAFF"), projectFileController.deleteProjectFile);

export const projectFileRoutes = router;
