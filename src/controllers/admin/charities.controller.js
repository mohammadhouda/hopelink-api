import {
  getCharitiesService,
  createCharitiesService,
  updateCharityService,
  deleteCharityService,
  getCharityService,
} from "../../services/admin/charities.service.js";
import { success, failure } from "../../utils/response.js";

// charity.controller.js
export async function getCharitiesController(req, res) {
  try {
    const { search, status, category, city, page = 1, limit = 8 } = req.query;
    const { charities, total } = await getCharitiesService({
      search,
      status,
      category,
      city,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    if (total === 0) return failure(res, "No active charities found.", 200);
    return success(
      res,
      { items: charities, total },
      "Active charities fetched successfully.",
      200,
    );
  } catch (error) {
    return failure(res, error.message);
  }
}

export async function createCharityController(req, res) {
  try {
    const {
      name,
      logoUrl,
      email,
      password,
      phone,
      address,
      websiteUrl,
      category,
      city,
    } = req.body;

    const result = await createCharitiesService({
      name,
      logoUrl,
      email,
      password,
      phone,
      address,
      websiteUrl,
      category,
      city,
    });

    return success(res, result, "Charity created successfully.", 201);
  } catch (error) {
    return failure(res, error.message);
  }
}

export async function getCharityController(req, res) {
  try {
    const { userId } = req.params;
    const charity = await getCharityService(userId);
    return success(res, charity, "Charity fetched successfully.", 200);
  } catch (error) {
    const status = error.message === "Charity not found." ? 404 : 500;
    return failure(res, error.message, status);
  }
}

export async function updateCharityController(req, res) {
  try {
    const { userId } = req.params;
    const payload = req.body;

    if (!userId) {
      return failure(res, "User ID is required.", 400);
    }

    if (!payload || Object.keys(payload).length === 0) {
      return failure(res, "No data provided to update.", 400);
    }

    const updatedCharity = await updateCharityService(userId, payload);

    return success(res, updatedCharity, "Charity updated successfully.", 200);
  } catch (error) {
    return failure(res, error.message);
  }
}

export async function deleteCharityController(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return failure(res, "User ID is required.", 400);
    }
    await deleteCharityService(userId);

    return success(
      res,
      null,
      `Charity with user ID ${userId} deleted (soft delete).`,
      200,
    );
  } catch (error) {
    return failure(res, error.message);
  }
}
