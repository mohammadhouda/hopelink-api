import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as roomService from "../../services/charity/room.service.js";

export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await roomService.getRoomsByCharity(req.charityId);
  return success(res, rooms);
});

export const getRoom = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomByOpportunity(
    req.charityId,
    parseInt(req.params.opportunityId),
  );
  return success(res, room);
});

export const getRoomMessages = asyncHandler(async (req, res) => {
  const result = await roomService.getRoomMessages(
    req.charityId,
    parseInt(req.params.opportunityId),
    { page: req.pagination.page, limit: req.pagination.limit },
  );
  return success(res, result);
});

export const closeRoom = asyncHandler(async (req, res) => {
  const room = await roomService.closeRoom(
    req.charityId,
    parseInt(req.params.opportunityId),
  );
  return success(res, room, "Room closed");
});
