import express from "express";
import attachCharity from "../../middlewares/attachCharity.js";

import profileRoutes from "./profile.routes.js";
import projectRoutes from "./project.routes.js";
import opportunityRoutes from "./opportunity.routes.js";
import applicationRoutes from "./application.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import ratingRoutes from "./rating.routes.js";
import certificateRoutes from "./certificate.routes.js";
import roomRoutes from "./room.routes.js";

const router = express.Router();

// Attach charityId to all routes below
router.use(attachCharity);

router.use("/profile", profileRoutes);
router.use("/projects", projectRoutes);
router.use("/opportunities", opportunityRoutes);
router.use("/applications", applicationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/ratings", ratingRoutes);
router.use("/certificates", certificateRoutes);
router.use("/rooms", roomRoutes);

export default router;
