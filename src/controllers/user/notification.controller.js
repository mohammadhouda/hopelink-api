import { success, failure } from "../../utils/response.js";
import * as notificationService from "../../services/notification.service.js";

export async function getNotifications(req, res) {
  try {
    const { page, limit } = req.query;
    const parsedLimit = parseInt(limit) || 15;
    const parsedPage  = parseInt(page)  || 1;
    const result = await notificationService.getNotifications(req.user.id, {
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch notifications", err.status || 500);
  }
}

export async function getUnreadCount(req, res) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    return success(res, { unreadCount: count });
  } catch (err) {
    return failure(res, err.message || "Failed to fetch unread count", err.status || 500);
  }
}

export async function markAsRead(req, res) {
  try {
    await notificationService.markAsRead(req.user.id, parseInt(req.params.id));
    return success(res, null, "Notification marked as read");
  } catch (err) {
    return failure(res, err.message || "Failed to mark notification as read", err.status || 500);
  }
}

export async function markAllAsRead(req, res) {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return success(res, null, "All notifications marked as read");
  } catch (err) {
    return failure(res, err.message || "Failed to mark notifications as read", err.status || 500);
  }
}

export async function deleteNotification(req, res) {
  try {
    await notificationService.deleteNotification(req.user.id, parseInt(req.params.id));
    return success(res, null, "Notification deleted");
  } catch (err) {
    return failure(res, err.message || "Failed to delete notification", err.status || 500);
  }
}
