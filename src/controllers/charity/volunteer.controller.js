import { success, failure } from "../../utils/response.js";
import * as volunteerService from "../../services/charity/volunteer.service.js";

export async function getVolunteers(req, res) {
  try {
    const charityId = req.charityId;
    const { page, limit, opportunityId, search } = req.query;
    const result = await volunteerService.getVolunteers(charityId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      opportunityId: opportunityId ? parseInt(opportunityId) : undefined,
      search,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch volunteers", err.status || 500);
  }
}

export async function getVolunteerDetails(req, res) {
  try {
    const charityId = req.charityId;
    const volunteerId = parseInt(req.params.id);
    const result = await volunteerService.getVolunteerDetails(charityId, volunteerId);
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch volunteer details", err.status || 500);
  }
}

export async function removeVolunteer(req, res) {
  try {
    const charityId = req.charityId;
    const volunteerId = parseInt(req.params.id);
    const { opportunityId } = req.body;
    if (!opportunityId) return failure(res, "opportunityId is required", 400);
    const result = await volunteerService.removeVolunteer(charityId, volunteerId, parseInt(opportunityId));
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to remove volunteer", err.status || 500);
  }
}

export async function sendEmailToVolunteer(req, res) {
  try {
    const charityId = req.charityId;
    const volunteerId = parseInt(req.params.id);
    const { subject, body } = req.body;
    if (!subject || !body) return failure(res, "subject and body are required", 400);
    const result = await volunteerService.sendEmailToVolunteer(charityId, volunteerId, { subject, body });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to send email", err.status || 500);
  }
}
