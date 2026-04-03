import * as notificationService from "../services/notification.service.js";

export async function getNotifications(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const unreadOnly = req.query.unreadOnly === "true";

    const data = await notificationService.getNotifications(req.user.id, {
      limit,
      offset,
      unreadOnly,
    });

    res.json(data);
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

export async function getUnreadCount(req, res) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
}

export async function markAsRead(req, res) {
  try {
    const id = parseInt(req.params.id);
    await notificationService.markAsRead(req.user.id, id);
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
}

export async function markAllAsRead(req, res) {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
}

export async function deleteNotification(req, res) {
  try {
    const id = parseInt(req.params.id);
    await notificationService.deleteNotification(req.user.id, id);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
}
