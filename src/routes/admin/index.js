import express from "express";
import dashboardRoutes from "./dashboard.routes.js";
import profileRoutes from "./profile.routes.js";
import usersRoutes from "./users.routes.js";
import charitiesRoutes from "./charities.routes.js";
import requestsRoutes from "./requests.routes.js";
import reportsRoutes from "./reports.routes.js";
import notificationsRoutes from "./notifications.routes.js";
import settingsRoutes from "./settings.routes.js";

const router = express.Router();

router.use("/dashboard", dashboardRoutes);
router.use("/profile", profileRoutes);
router.use("/users", usersRoutes);
router.use("/charities", charitiesRoutes);
router.use("/requests", requestsRoutes);
router.use("/reports", reportsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/settings", settingsRoutes);

export default router;
