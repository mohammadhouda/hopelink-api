import {
  uploadFileService,
  uploadFilesService,
} from "../services/upload.service.js";
import { success, failure } from "../utils/response.js";

// POST /api/upload/single?bucket=documents
export async function uploadSingleController(req, res) {
  try {
    if (!req.file) {
      return failure(res, "No file provided.", 400);
    }

    const bucket = req.query.bucket || "documents";
    const result = await uploadFileService(req.file, bucket);

    return success(res, result, "File uploaded successfully.", 201);
  } catch (error) {
    return failure(res, error.message);
  }
}

// POST /api/upload/multiple?bucket=documents
export async function uploadMultipleController(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return failure(res, "No files provided.", 400);
    }

    const bucket = req.query.bucket || "documents";
    const results = await uploadFilesService(req.files, bucket);

    return success(
      res,
      results,
      `${results.length} file(s) uploaded successfully.`,
      201,
    );
  } catch (error) {
    return failure(res, error.message);
  }
}
