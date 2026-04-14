import { success, failure } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPlatformStats } from "../services/public.service.js";
import { createRegistrationRequestService } from "../services/admin/requests.service.js";
import notificationEmitter, { NOTIFY_ADMINS } from "../events/notificationEmitter.js";

export const statsController = asyncHandler(async (_req, res) => {
  const stats = await getPlatformStats();
  return success(res, stats);
});

export const submitRegistrationController = asyncHandler(async (req, res) => {
  const { name, email, phone, city, category, message } = req.body;
  if (!name?.trim() || !email?.trim()) {
    return failure(res, "Name and email are required.", 400);
  }

  const request = await createRegistrationRequestService({
    name, email, phone, city, category, message,
  });

  notificationEmitter.emit(NOTIFY_ADMINS, {
    title:   "New Registration Request",
    message: `${name} has submitted a registration request.`,
    type:    "INFO",
    link:    "/admin/requests",
  });

  return success(res, request, "Registration request submitted.", 201);
});
