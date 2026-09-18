import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";

import {
	createClientValidation,
	updateClientActiveValidation,
	updateClientValidation,
	updateMyClientProfileValidation,
} from "./client.validation";
import { clientController } from "./client.controller";

const router = Router();

// Self-service — the logged-in client
router.get("/me", requireAuth, requireRole("CLIENT"), clientController.getMyClientProfile);
router.patch(
	"/me",
	requireAuth,
	requireRole("CLIENT"),
	validateRequest(updateMyClientProfileValidation),
	clientController.updateMyClientProfile,
);

// Admin/Staff management
router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createClientValidation),
	clientController.createClient,
);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), clientController.getAllClients);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), clientController.getClientById);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateClientValidation),
	clientController.updateClient,
);
router.patch(
	"/:id/active",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateClientActiveValidation),
	clientController.updateClientActive,
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), clientController.deleteClient);

export const clientRoutes = router;
