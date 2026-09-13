import { Router } from "express";

import { requireAuth, requireRole } from "../../middlewares/requireAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as proposalController from "./proposal.controller";
import { createProposalValidation, updateProposalValidation } from "./proposal.validation";

const router = Router();

router.post(
	"/",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(createProposalValidation),
	proposalController.createProposal,
);
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.getAllProposals);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.getProposalById);
router.patch(
	"/:id",
	requireAuth,
	requireRole("ADMIN", "STAFF"),
	validateRequest(updateProposalValidation),
	proposalController.updateProposal,
);

// Lifecycle actions — each enforces its own valid starting state and stamps the
// matching timestamp (sentAt/viewedAt/acceptedAt/rejectedAt) in the service layer.
router.post("/:id/send", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.sendProposal);
router.post("/:id/mark-viewed", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.markProposalViewed);
router.post("/:id/accept", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.acceptProposal);
router.post("/:id/reject", requireAuth, requireRole("ADMIN", "STAFF"), proposalController.rejectProposal);

router.delete("/:id", requireAuth, requireRole("ADMIN"), proposalController.deleteProposal);

export const proposalRoutes = router;
