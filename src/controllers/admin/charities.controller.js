import {
  getCharitiesService,
  createCharitiesService,
  updateCharityService,
  deleteCharityService,
  getCharityService,
} from "../../services/admin/charities.service.js";
import { success, failure } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getCharitiesController = asyncHandler(async (req, res) => {
  const { search, status, category, city } = req.query;
  const { charities, total } = await getCharitiesService({
    search,
    status,
    category,
    city,
    skip: req.pagination.skip,
    take: req.pagination.take,
  });
  if (total === 0) return failure(res, "No active charities found.", 200);
  return success(
    res,
    { items: charities, total },
    "Active charities fetched successfully.",
    200,
  );
});

export const createCharityController = asyncHandler(async (req, res) => {
  const { name, logoUrl, email, password, phone, address, websiteUrl, category, city } = req.body;
  const result = await createCharitiesService({
    name, logoUrl, email, password, phone, address, websiteUrl, category, city,
  });
  return success(res, result, "Charity created successfully.", 201);
});

export const getCharityController = asyncHandler(async (req, res) => {
  const charity = await getCharityService(req.params.userId);
  return success(res, charity, "Charity fetched successfully.", 200);
});

export const updateCharityController = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;
  if (!payload || Object.keys(payload).length === 0) {
    return failure(res, "No data provided to update.", 400);
  }
  const updatedCharity = await updateCharityService(userId, payload);
  return success(res, updatedCharity, "Charity updated successfully.", 200);
});

export const deleteCharityController = asyncHandler(async (req, res) => {
  await deleteCharityService(req.params.userId);
  return success(
    res,
    null,
    `Charity with user ID ${req.params.userId} deleted (soft delete).`,
    200,
  );
});
