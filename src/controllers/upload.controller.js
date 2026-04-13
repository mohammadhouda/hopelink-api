import { uploadFileService, uploadFilesService } from "../services/upload.service.js";
import { success, failure } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadSingleController = asyncHandler(async (req, res) => {
  if (!req.file) return failure(res, "No file provided.", 400);
  const bucket = req.query.bucket || "documents";
  const folder = req.query.folder || null;
  const result = await uploadFileService(req.file, bucket, folder);
  return success(res, result, "File uploaded successfully.", 201);
});

export const uploadMultipleController = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) return failure(res, "No files provided.", 400);
  const bucket = req.query.bucket || "documents";
  const folder = req.query.folder || null;
  const results = await uploadFilesService(req.files, bucket, folder);
  return success(res, results, `${results.length} file(s) uploaded successfully.`, 201);
});
