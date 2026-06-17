import express from "express";
import { createVerificationRequestService } from "../../services/admin/requests.service.js";
import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import notificationEmitter, { NOTIFY_ADMINS } from "../../events/notificationEmitter.js";

const router = express.Router();

router.post("/", asyncHandler(async (req, res) => {
  const { documents, message } = req.body;
  const request = await createVerificationRequestService(req.user.id, { documents, message });
  notificationEmitter.emit(NOTIFY_ADMINS, {
    title:   "New Verification Request",
    message: `${req.user.name} has submitted a verification request.`,
    type:    "INFO",
    link:    "/admin/requests",
  });
  return success(res, request, "Verification request submitted.", 201);
}));

export default router;
