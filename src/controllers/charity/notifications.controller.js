import * as notificationService from "../../services/notification.service.js";
import { success, failure } from "../../utils/response.js";

export async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const { page, limit } = req.query;
    const result = await notificationService.getNotifications(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return success(res, result);
  } catch (err) {
    return failure(
      res,
      err.message || "Failed to fetch notifications",
      err.status || 500,
    );
  }
}

export async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);
    return success(res, { unreadCount: count });
  } catch (err) {
    return failure(
      res,
      err.message || "Failed to fetch unread count",
      err.status || 500,
    );
  }
}

export async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);
    return success(res, null, "All notifications marked as read");
  } catch (err) {
    return failure(
      res,
      err.message || "Failed to mark notifications as read",
      err.status || 500,
    );
  }
}

export async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);
    await notificationService.markAsRead(userId, notificationId);
    return success(res, null, "Notification marked as read");
  } catch (err) {
    return failure(
      res,
      err.message || "Failed to mark notification as read",
      err.status || 500,
    );
  }
}

export async function deleteNotification(req, res) {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);
    await notificationService.deleteNotification(userId, notificationId);
    return success(res, null, "Notification deleted");
  } catch (err) {
    return failure(
      res,
      err.message || "Failed to delete notification",
      err.status || 500,
    );
  }
}
