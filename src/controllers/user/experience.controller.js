import { success, failure } from "../../utils/response.js";
import * as expService from "../../services/user/experience.service.js";

export async function getExperiences(req, res) {
  try {
    const list = await expService.getExperiences(req.user.id);
    return success(res, list);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch experiences", err.status || 500);
  }
}

export async function addExperience(req, res) {
  try {
    const exp = await expService.addExperience(req.user.id, req.body);
    return success(res, exp, "Experience added", 201);
  } catch (err) {
    return failure(res, err.message || "Failed to add experience", err.status || 500);
  }
}

export async function updateExperience(req, res) {
  try {
    const exp = await expService.updateExperience(req.user.id, parseInt(req.params.id), req.body);
    return success(res, exp, "Experience updated");
  } catch (err) {
    return failure(res, err.message || "Failed to update experience", err.status || 500);
  }
}

export async function deleteExperience(req, res) {
  try {
    await expService.deleteExperience(req.user.id, parseInt(req.params.id));
    return success(res, null, "Experience deleted");
  } catch (err) {
    return failure(res, err.message || "Failed to delete experience", err.status || 500);
  }
}
