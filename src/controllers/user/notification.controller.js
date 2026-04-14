import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as notificationService from "../../services/notification.service.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user.id, {
    limit: req.pagination.limit,
    offset: req.pagination.skip,
  });
  return success(res, result);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  return success(res, { unreadCount: count });
});

export const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.user.id, parseInt(req.params.id));
  return success(res, null, "Notification marked as read");
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  return success(res, null, "All notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user.id, parseInt(req.params.id));
  return success(res, null, "Notification deleted");
});
