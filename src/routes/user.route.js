import express from "express";
import {
  getUsersController,
  createUserController,
  updateUserController,
  deleteUserController
} from "../controllers/user.controller.js";

import { validate } from "../middlewares/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema
} from "../validators/user.validator.js";

const router = express.Router();

router.get("/", getUsersController);

router.post(
  "/",
  validate(createUserSchema),
  createUserController
);

router.patch(
  "/:userId",
  validate(userIdParamSchema, "params"),
  validate(updateUserSchema),
  updateUserController
);

router.delete(
  "/:userId",
  validate(userIdParamSchema, "params"),
  deleteUserController
);

export default router;
