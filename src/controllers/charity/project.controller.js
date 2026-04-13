import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as projectService from "../../services/charity/project.service.js";

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.charityId, req.body);
  return success(res, project, "Project created", 201);
});

export const getProjects = asyncHandler(async (req, res) => {
  const { page, limit, status, startFrom, startTo } = req.query;
  const result = await projectService.getProjects(req.charityId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    status,
    startFrom,
    startTo,
  });
  return success(res, result);
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(
    req.charityId,
    parseInt(req.params.id),
  );
  return success(res, project);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.charityId,
    parseInt(req.params.id),
    req.body,
  );
  return success(res, project, "Project updated");
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.charityId, parseInt(req.params.id));
  return success(res, null, "Project deleted");
});
