import {
  getUsersService,
  getUserService,
  getUserCitiesService,
  updateUserService,
  deleteUserService,
  createUserService,
} from "../../services/admin/users.service.js";
import { success, failure } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getUsersController = asyncHandler(async (req, res) => {
  const { search, status, role, city, page = 1, limit = 10 } = req.query;
  const { users, total } = await getUsersService({
    search,
    status,
    role,
    city,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });
  if (total === 0) return failure(res, "No users found.", 200);
  return success(res, { items: users, total }, "Users fetched successfully.", 200);
});

export const getUserCitiesController = asyncHandler(async (req, res) => {
  const cities = await getUserCitiesService();
  return success(res, cities, "Cities fetched successfully.", 200);
});

export const getUserController = asyncHandler(async (req, res) => {
  const user = await getUserService(req.params.userId);
  return success(res, user, "User fetched successfully.", 200);
});

export const updateUserController = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;
  if (Object.keys(updateData).length === 0) {
    return failure(res, "No data provided for update.", 400);
  }
  const updatedUser = await updateUserService(userId, updateData);
  return success(res, updatedUser, "User updated successfully.", 200);
});

export const deleteUserController = asyncHandler(async (req, res) => {
  await deleteUserService(req.params.userId);
  return success(res, null, `User with ID ${req.params.userId} deleted (soft delete).`, 200);
});

export const createUserController = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, avatarUrl, city, country, bio } = req.body;
  const newUser = await createUserService({
    name, email, password, role, phone, avatarUrl, city, country, bio,
  });
  return success(res, newUser, "User created successfully.", 201);
});
