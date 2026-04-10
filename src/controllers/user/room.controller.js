import { success, failure } from "../../utils/response.js";
import * as roomService from "../../services/user/room.service.js";

export async function getMyRooms(req, res) {
  try {
    const data = await roomService.getMyRooms(req.user.id);
    return success(res, data);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch rooms", err.status || 500);
  }
}

export async function getRoom(req, res) {
  try {
    const data = await roomService.getRoom(req.user.id, parseInt(req.params.opportunityId));
    return success(res, data);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch room", err.status || 500);
  }
}

export async function getRoomMessages(req, res) {
  try {
    const { page, limit } = req.query;
    const data = await roomService.getRoomMessages(req.user.id, parseInt(req.params.opportunityId), {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });
    return success(res, data);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch messages", err.status || 500);
  }
}
