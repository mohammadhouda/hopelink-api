import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as expService from "../../services/user/experience.service.js";

export const getExperiences = asyncHandler(async (req, res) => {
  const list = await expService.getExperiences(req.user.id);
  return success(res, list);
});

export const addExperience = asyncHandler(async (req, res) => {
  const exp = await expService.addExperience(req.user.id, req.body);
  return success(res, exp, "Experience added", 201);
});

export const updateExperience = asyncHandler(async (req, res) => {
  const exp = await expService.updateExperience(
    req.user.id,
    parseInt(req.params.id),
    req.body,
  );
  return success(res, exp, "Experience updated");
});

export const deleteExperience = asyncHandler(async (req, res) => {
  await expService.deleteExperience(req.user.id, parseInt(req.params.id));
  return success(res, null, "Experience deleted");
});
