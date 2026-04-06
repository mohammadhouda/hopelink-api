import express from "express";
import * as ctrl from "../../controllers/charity/room.controller.js";

const router = express.Router();

// :opportunityId scoped to charity
router.get("/", ctrl.getRooms);
router.get("/:opportunityId", ctrl.getRoom);
router.get("/:opportunityId/messages", ctrl.getRoomMessages);
router.patch("/:opportunityId/close", ctrl.closeRoom);

export default router;
