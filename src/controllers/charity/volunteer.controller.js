import { success, failure } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as volunteerService from "../../services/charity/volunteer.service.js";

export const getVolunteers = asyncHandler(async (req, res) => {
  const { opportunityId, search } = req.query;
  const result = await volunteerService.getVolunteers(req.charityId, {
    ...req.pagination,
    opportunityId: opportunityId ? parseInt(opportunityId) : undefined,
    search,
  });
  return success(res, result);
});

export const getVolunteerDetails = asyncHandler(async (req, res) => {
  const result = await volunteerService.getVolunteerDetails(
    req.charityId,
    parseInt(req.params.id),
  );
  return success(res, result);
});

export const removeVolunteer = asyncHandler(async (req, res) => {
  const { opportunityId } = req.body;
  if (!opportunityId) return failure(res, "opportunityId is required", 400);
  const result = await volunteerService.removeVolunteer(
    req.charityId,
    parseInt(req.params.id),
    parseInt(opportunityId),
  );
  return success(res, result);
});

export const sendEmailToVolunteer = asyncHandler(async (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) return failure(res, "subject and body are required", 400);
  const result = await volunteerService.sendEmailToVolunteer(
    req.charityId,
    parseInt(req.params.id),
    { subject, body },
  );
  return success(res, result);
});
