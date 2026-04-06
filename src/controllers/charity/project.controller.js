import { success, failure } from "../../utils/response.js";
import * as projectService from "../../services/charity/project.service.js";

export async function createProject(req, res) {
  try {
    const project = await projectService.createProject(req.charityId, req.body);
    return success(res, project, "Project created", 201);
  } catch (err) {
    return failure(res, err.message || "Failed to create project", err.status || 500);
  }
}

export async function getProjects(req, res) {
  try {
    const { page, limit, status } = req.query;
    const result = await projectService.getProjects(req.charityId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch projects", err.status || 500);
  }
}

export async function getProject(req, res) {
  try {
    const project = await projectService.getProjectById(req.charityId, parseInt(req.params.id));
    return success(res, project);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch project", err.status || 500);
  }
}

export async function updateProject(req, res) {
  try {
    const project = await projectService.updateProject(req.charityId, parseInt(req.params.id), req.body);
    return success(res, project, "Project updated");
  } catch (err) {
    return failure(res, err.message || "Failed to update project", err.status || 500);
  }
}

export async function deleteProject(req, res) {
  try {
    await projectService.deleteProject(req.charityId, parseInt(req.params.id));
    return success(res, null, "Project deleted");
  } catch (err) {
    return failure(res, err.message || "Failed to delete project", err.status || 500);
  }
}
