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
import { broadcastToAdmins } from "../../services/notification.service.js";

// ── Registration Requests ─────────────────────────────────────────────────────

export async function getRegistrationRequestsController(req, res) {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { items, total } = await getRegistrationRequestsService({
      status,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    if (total === 0)
      return failure(res, "No registration requests found.", 200);
    return success(
      res,
      { items, total },
      "Registration requests fetched.",
      200,
    );
  } catch (error) {
    return failure(res, error.message);
  }
}

export async function getRegistrationRequestController(req, res) {
  try {
    const { id } = req.params;
    const request = await getRegistrationRequestService(id);
    return success(res, request, "Registration request fetched.", 200);
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 500;
    return failure(res, error.message, status);
  }
}

export async function createRegistrationRequestController(req, res) {
  try {
    const { name, email, phone, city, category, message } = req.body;
    const request = await createRegistrationRequestService({
      name,
      email,
      phone,
      city,
      category,
      message,
    });

    await broadcastToAdmins({
      title: "New Registration Request",
      message: `${name} has submitted a registration request.`,
      type: "INFO",
      link: "/requests",
    });

    return success(res, request, "Registration request submitted.", 201);
  } catch (error) {
    return failure(res, error.message);
  }
}

export async function approveRegistrationRequestController(req, res) {
  try {
    const { id } = req.params;

    const adminId = req.user?.id ?? null;

    if (!adminId) throw new Error("Admin authentication required.");

    const result = await approveRegistrationRequestService(id, adminId);

    await broadcastToAdmins({
      title: "Registration Request Approved",
      message: `Registration request #${id} has been approved.`,
      type: "SUCCESS",
      link: "/requests",
    });

    return success(
      res,
      result,
      "Registration request approved. Charity account created.",
      200,
    );
  } catch (error) {
    return failure(res, error.message);
  }
}

export async function declineRegistrationRequestController(req, res) {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;
    const adminId = req.user?.id ?? null;

    if (!adminId) throw new Error("Admin authentication required.");

    const result = await declineRegistrationRequestService(
      id,
      adminId,
      reviewNote,
    );

    await broadcastToAdmins({
      title: "Registration Request Declined",
      message: `Registration request #${id} has been declined.`,
      type: "ERROR",
      link: "/requests",
    });

    return success(res, result, "Registration request declined.", 200);
  } catch (error) {
    return failure(res, error.message);
  }
}

// ── Verification Requests ─────────────────────────────────────────────────────

export async function getVerificationRequestsController(req, res) {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { items, total } = await getVerificationRequestsService({
      status,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    if (total === 0)
      return failure(res, "No verification requests found.", 200);
    return success(
      res,
      { items, total },
      "Verification requests fetched.",
      200,
    );
  } catch (error) {
    return failure(res, error.message);
  }
}

export async function getVerificationRequestController(req, res) {
  try {
    const { id } = req.params;
    const request = await getVerificationRequestService(id);
    return success(res, request, "Verification request fetched.", 200);
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 500;
    return failure(res, error.message, status);
  }
}

export async function createVerificationRequestController(req, res) {
  try {
    const { userId } = req.params;
    const { documents, message } = req.body;
    const request = await createVerificationRequestService(userId, {
      documents,
      message,
    });

    await broadcastToAdmins({
      title: "New Verification Request",
      message: `${req.user?.name} has submitted a verification request.`,
      type: "INFO",
      link: "/requests",
    });

    return success(res, request, "Verification request submitted.", 201);
  } catch (error) {
    return failure(res, error.message);
  }
}

export async function approveVerificationRequestController(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user?.id ?? null;

    if (!adminId) throw new Error("Admin authentication required.");

    const result = await approveVerificationRequestService(id, adminId);

    await broadcastToAdmins({
      title: "Verification Request Approved",
      message: `Verification request #${id} has been approved.`,
      type: "SUCCESS",
      link: "/requests",
    });

    return success(
      res,
      result,
      "Verification approved. Charity is now verified.",
      200,
    );
  } catch (error) {
    return failure(res, error.message);
  }
}

export async function declineVerificationRequestController(req, res) {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;
    const adminId = req.user?.id ?? null;

    if (!adminId) throw new Error("Admin authentication required.");

    const result = await declineVerificationRequestService(
      id,
      adminId,
      reviewNote,
    );

    await broadcastToAdmins({
      title: "Verification Request Declined",
      message: `Verification request #${id} has been declined.`,
      type: "ERROR",
      link: "/requests",
    });

    return success(res, result, "Verification request declined.", 200);
  } catch (error) {
    return failure(res, error.message);
  }
}
