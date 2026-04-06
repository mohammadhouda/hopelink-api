import { success, failure } from "../../utils/response.js";
import * as roomService from "../../services/charity/room.service.js";

export async function getRooms(req, res) {
  try {
    const rooms = await roomService.getRoomsByCharity(req.charityId);
    return success(res, rooms);
  } catch (err) {
    return failure(
      res,
      err.message || "Failed to fetch rooms",
      err.status || 500,
    );
  }
}

export async function getRoom(req, res) {
  try {
    const room = await roomService.getRoomByOpportunity(
      req.charityId,
      parseInt(req.params.opportunityId),
    );
    return success(res, room);
  } catch (err) {
    return failure(
      res,
      err.message || "Failed to fetch room",
      err.status || 500,
    );
  }
}

export async function getRoomMessages(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await roomService.getRoomMessages(
      req.charityId,
      parseInt(req.params.opportunityId),
      {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
      },
    );
    return success(res, result);
  } catch (err) {
    return failure(
      res,
      err.message || "Failed to fetch messages",
      err.status || 500,
    );
  }
}

export async function closeRoom(req, res) {
  try {
    const room = await roomService.closeRoom(
      req.charityId,
      parseInt(req.params.opportunityId),
    );
    return success(res, room, "Room closed");
  } catch (err) {
    return failure(
      res,
      err.message || "Failed to close room",
      err.status || 500,
    );
  }
}
