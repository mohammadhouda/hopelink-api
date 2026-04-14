import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as roomService from "../../services/user/room.service.js";

export const getMyRooms = asyncHandler(async (req, res) => {
  const data = await roomService.getMyRooms(req.user.id);
  return success(res, data);
});

export const getRoom = asyncHandler(async (req, res) => {
  const data = await roomService.getRoom(
    req.user.id,
    parseInt(req.params.opportunityId),
  );
  return success(res, data);
});

export const getRoomMessages = asyncHandler(async (req, res) => {
  const data = await roomService.getRoomMessages(
    req.user.id,
    parseInt(req.params.opportunityId),
    { page: req.pagination.page, limit: req.pagination.limit },
  );
  return success(res, data);
});
