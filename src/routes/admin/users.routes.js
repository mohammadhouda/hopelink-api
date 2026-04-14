import express from "express";
import {
  getUsersController,
  getUserController,
  getUserCitiesController,
  createUserController,
  updateUserController,
  deleteUserController,
} from "../../controllers/admin/users.controller.js";
import { validate } from "../../middlewares/validate.js";
import { parsePagination } from "../../middlewares/parsePagination.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../../validators/user.validator.js";

const router = express.Router();

router.get("/",        parsePagination(), getUsersController);
router.get("/cities",  getUserCitiesController);
router.get(
  "/:userId",
  validate(userIdParamSchema, "params"),
  getUserController
);
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