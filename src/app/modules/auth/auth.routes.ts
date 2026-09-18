import { Router } from "express";

import { requireAuth } from "../../middlewares/requireAuth";
import * as authController from "./auth.controller";

const router = Router();

router.get("/session", requireAuth, authController.getMySession);

export const authRoutes = router;