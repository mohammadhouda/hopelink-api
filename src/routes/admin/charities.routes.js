import express from "express";
import {
  getCharitiesController,
  getCharityController,
  createCharityController,
  updateCharityController,
  deleteCharityController,
} from "../../controllers/admin/charities.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  charityIdParamSchema,
  createCharitySchema,
  updateCharitySchema,
} from "../../validators/charity.validator.js";

const router = express.Router();

router.get("/", getCharitiesController);

router.post("/", validate(createCharitySchema), createCharityController);
router.get(
  "/:userId",
  validate(charityIdParamSchema, "params"),
  getCharityController,
);
router.patch(
  "/:userId",
  validate(charityIdParamSchema, "params"),
  validate(updateCharitySchema),
  updateCharityController,
);
router.delete(
  "/:userId",
  validate(charityIdParamSchema, "params"),
  deleteCharityController,
);

export default router;
