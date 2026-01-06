import {getUsersService, updateUserService, deleteUserService, createUserService} from "../services/user.service.js";
import { success, failure } from "../utils/response.js";

export async function getUsersController(req, res) {
    try {
        const users = await getUsersService();
        return success(
            res,
            users,
            users.length ? "Users fetched successfully." : "No users found."
            );
    } catch (error) {
        return failure(res, error.message);
    }
}

export async function updateUserController(req, res) {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        if (Object.keys(updateData).length === 0) {
            return failure(res, "No data provided for update.", 400);
        }

        if (!userId) {
            return failure(res, "User ID is required.", 400);
        }

        const updatedUser = await updateUserService(userId, updateData);

        return success(res, updatedUser, "User updated successfully.", 200);
    } catch (error) {
        return failure(res, error.message);
    }
}

export async function deleteUserController(req, res) {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        await deleteUserService(userId);

        return success(res, null, `User with ID ${userId} deleted (soft delete).`, 200);
    } catch (error) {
        return failure(res, error.message);
    }
}

export async function createUserController(req, res) {
    try {
        const { name, email, password, role, phone, avatarUrl, city, country, bio } = req.body;

        const newUser = await createUserService({ name, email, password, role, phone, avatarUrl, city, country, bio });

        return success(res, newUser, "User created successfully.", 201);
    } catch (error) {
        return failure(res, error.message);
    }
}