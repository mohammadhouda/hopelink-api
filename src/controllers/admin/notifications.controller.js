import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as notificationService from "../../services/notification.service.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const limit     = parseInt(req.query.limit)  || 20;
  const offset    = parseInt(req.query.offset) || 0;
  const unreadOnly = req.query.unreadOnly === "true";
  const data = await notificationService.getNotifications(req.user.id, {
    limit,
    offset,
    unreadOnly,
  });
  return success(res, data);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  return success(res, { unreadCount: count });
});

export const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.user.id, parseInt(req.params.id));
  return success(res, null, "Marked as read");
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  return success(res, null, "All notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user.id, parseInt(req.params.id));
  return success(res, null, "Notification deleted");
});
