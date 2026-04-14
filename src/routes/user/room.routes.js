import express from "express";
import * as ctrl from "../../controllers/user/room.controller.js";
import { parsePagination } from "../../middlewares/parsePagination.js";

const router = express.Router();

router.get("/", ctrl.getMyRooms);
router.get("/:opportunityId", ctrl.getRoom);
router.get("/:opportunityId/messages", parsePagination(), ctrl.getRoomMessages);

export default router;
