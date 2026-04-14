import {
  getRegistrationRequestsService,
  getRegistrationRequestService,
  createRegistrationRequestService,
  approveRegistrationRequestService,
  declineRegistrationRequestService,
  getVerificationRequestsService,
  getVerificationRequestService,
  createVerificationRequestService,
  approveVerificationRequestService,
  declineVerificationRequestService,
} from "../../services/admin/requests.service.js";
import { success, failure } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import notificationEmitter, { NOTIFY_ADMINS } from "../../events/notificationEmitter.js";

// ── Registration Requests ─────────────────────────────────────────────────────

export const getRegistrationRequestsController = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { items, total } = await getRegistrationRequestsService({
    status,
    skip: req.pagination.skip,
    take: req.pagination.take,
  });
  if (total === 0) return failure(res, "No registration requests found.", 200);
  return success(res, { items, total }, "Registration requests fetched.", 200);
});

export const getRegistrationRequestController = asyncHandler(async (req, res) => {
  const request = await getRegistrationRequestService(req.params.id);
  return success(res, request, "Registration request fetched.", 200);
});

export const createRegistrationRequestController = asyncHandler(async (req, res) => {
  const { name, email, phone, city, category, message } = req.body;
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

export const approveRegistrationRequestController = asyncHandler(async (req, res) => {
  const result = await approveRegistrationRequestService(req.params.id, req.user.id);
  notificationEmitter.emit(NOTIFY_ADMINS, {
    title:   "Registration Request Approved",
    message: `Registration request #${req.params.id} has been approved.`,
    type:    "SUCCESS",
    link:    "/admin/requests",
  });
  return success(res, result, "Registration request approved. Charity account created.", 200);
});

export const declineRegistrationRequestController = asyncHandler(async (req, res) => {
  const result = await declineRegistrationRequestService(
    req.params.id,
    req.user.id,
    req.body.reviewNote,
  );
  notificationEmitter.emit(NOTIFY_ADMINS, {
    title:   "Registration Request Declined",
    message: `Registration request #${req.params.id} has been declined.`,
    type:    "ERROR",
    link:    "/admin/requests",
  });
  return success(res, result, "Registration request declined.", 200);
});

// ── Verification Requests ─────────────────────────────────────────────────────

export const getVerificationRequestsController = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { items, total } = await getVerificationRequestsService({
    status,
    skip: req.pagination.skip,
    take: req.pagination.take,
  });
  if (total === 0) return failure(res, "No verification requests found.", 200);
  return success(res, { items, total }, "Verification requests fetched.", 200);
});

export const getVerificationRequestController = asyncHandler(async (req, res) => {
  const request = await getVerificationRequestService(req.params.id);
  return success(res, request, "Verification request fetched.", 200);
});

export const createVerificationRequestController = asyncHandler(async (req, res) => {
  const { documents, message } = req.body;
  const request = await createVerificationRequestService(req.params.userId, {
    documents,
    message,
  });
  notificationEmitter.emit(NOTIFY_ADMINS, {
    title:   "New Verification Request",
    message: `${req.user?.name} has submitted a verification request.`,
    type:    "INFO",
    link:    "/admin/requests",
  });
  return success(res, request, "Verification request submitted.", 201);
});

export const approveVerificationRequestController = asyncHandler(async (req, res) => {
  const result = await approveVerificationRequestService(req.params.id, req.user.id);
  notificationEmitter.emit(NOTIFY_ADMINS, {
    title:   "Verification Request Approved",
    message: `Verification request #${req.params.id} has been approved.`,
    type:    "SUCCESS",
    link:    "/admin/requests",
  });
  return success(res, result, "Verification approved. Charity is now verified.", 200);
});

export const declineVerificationRequestController = asyncHandler(async (req, res) => {
  const result = await declineVerificationRequestService(
    req.params.id,
    req.user.id,
    req.body.reviewNote,
  );
  notificationEmitter.emit(NOTIFY_ADMINS, {
    title:   "Verification Request Declined",
    message: `Verification request #${req.params.id} has been declined.`,
    type:    "ERROR",
    link:    "/admin/requests",
  });
  return success(res, result, "Verification request declined.", 200);
});
