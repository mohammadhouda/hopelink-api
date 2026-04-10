import express from "express";

import profileRoutes from "./profile.routes.js";
import opportunityRoutes from "./opportunity.routes.js";
import applicationRoutes from "./application.routes.js";
import certificateRoutes from "./certificate.routes.js";
import notificationRoutes from "./notification.routes.js";
import roomRoutes from "./room.routes.js";

const router = express.Router();

router.use("/profile", profileRoutes);
router.use("/opportunities", opportunityRoutes);
router.use("/applications", applicationRoutes);
router.use("/certificates", certificateRoutes);
router.use("/notifications", notificationRoutes);
router.use("/rooms", roomRoutes);

export default router;
