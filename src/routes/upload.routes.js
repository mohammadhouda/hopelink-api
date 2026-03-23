import express from "express";
import multer from "multer";
import { uploadSingleController, uploadMultipleController } from "../controllers/upload.controller.js";

// Configure multer for in-memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files:    10,
  },
});

const router = express.Router();

// POST /api/upload/single?bucket=documents|logos
router.post("/single",   upload.single("file"),    uploadSingleController);

// POST /api/upload/multiple?bucket=documents|logos
router.post("/multiple", upload.array("files", 10), uploadMultipleController);

export default router;