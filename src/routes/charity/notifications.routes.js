import express from "express";
import * as ctrl from "../../controllers/charity/notifications.controller.js";

const router = express.Router();

router.get("/", ctrl.getNotifications);
router.get("/unread-count", ctrl.getUnreadCount);
router.put("/read-all", ctrl.markAllAsRead);
router.put("/:id/read", ctrl.markAsRead);
router.delete("/:id", ctrl.deleteNotification);

export default router;
