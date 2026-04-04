import express from "express";
import * as ctrl from "../../controllers/admin/settings.controller.js";
import authenticate from "../../middlewares/auth.js";
import restrictTo from "../../middlewares/restrictTo.js";

const router = express.Router();

// All settings routes require admin authentication
router.use(authenticate);
router.use(restrictTo("ADMIN"));

/* ── Platform Settings ──────────────────────────────────── */
router.get("/platform", ctrl.getPlatform);
router.put("/platform", ctrl.updatePlatform);

/* ── Roles & Permissions ────────────────────────────────── */
router.get("/roles", ctrl.getRoles);
router.post("/roles", ctrl.createRole);
router.put("/roles/:id", ctrl.updateRole);
router.delete("/roles/:id", ctrl.deleteRole);

/* ── Email Templates ────────────────────────────────────── */
router.get("/email-templates", ctrl.getEmailTemplates);
router.put("/email-templates/:id", ctrl.updateEmailTemplate);

/* ── Security ───────────────────────────────────────────── */
router.get("/sessions", ctrl.getSessions);
router.delete("/sessions/:sessionId", ctrl.revokeSession);
router.delete("/sessions", ctrl.revokeAllSessions);
router.get("/login-history", ctrl.getLoginHistory);

/* ── Audit Log ──────────────────────────────────────────── */
router.get("/audit-log", ctrl.getAuditLog);

/* ── API Keys ───────────────────────────────────────────── */
router.get("/api-keys", ctrl.getApiKeys);
router.post("/api-keys", ctrl.createApiKey);
router.delete("/api-keys/:id", ctrl.revokeApiKey);

/* ── Integrations ───────────────────────────────────────── */
router.get("/integrations", ctrl.getIntegrations);
router.patch("/integrations/:id/toggle", ctrl.toggleIntegration);

export default router;
