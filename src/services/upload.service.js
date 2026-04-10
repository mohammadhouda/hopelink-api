import supabase from "../config/Supabase.config.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const BUCKETS = {
  documents: "documents",
  logos: "logos",
};

// Allowed MIME types per bucket
const ALLOWED_TYPES = {
  documents: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  logos: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
};

const MAX_SIZE_MB = {
  documents: 10,
  logos: 5,
};

// ── Upload a single file
// folder: optional subfolder within the bucket (e.g. "profile", "posts")
export async function uploadFileService(file, bucket = "documents", folder = null) {
  if (!BUCKETS[bucket]) {
    throw new Error(
      `Invalid bucket. Allowed: ${Object.keys(BUCKETS).join(", ")}`,
    );
  }

  // Validate MIME type
  if (!ALLOWED_TYPES[bucket].includes(file.mimetype)) {
    throw new Error(
      `Invalid file type "${file.mimetype}". Allowed: ${ALLOWED_TYPES[bucket].join(", ")}`,
    );
  }

  // Validate file size
  const maxBytes = MAX_SIZE_MB[bucket] * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      `File too large. Maximum size is ${MAX_SIZE_MB[bucket]}MB.`,
    );
  }

  // unique file path: [folder/]uuid.ext
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${uuidv4()}${ext}`;
  const filePath = folder ? `${folder}/${filename}` : filename;

  const { error } = await supabase.storage
    .from(BUCKETS[bucket])
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Get the public URL
  const { data } = supabase.storage
    .from(BUCKETS[bucket])
    .getPublicUrl(filePath);

  return {
    url: data.publicUrl,
    filename: file.originalname, // example
    bucket,
    path: filePath,
  };
}

// ── Upload multiple files
export async function uploadFilesService(files, bucket = "documents", folder = null) {
  if (!files || files.length === 0) {
    throw new Error("No files provided.");
  }

  if (files.length > 10) {
    throw new Error("Maximum 10 files per upload.");
  }

  const results = await Promise.all(
    files.map((file) => uploadFileService(file, bucket, folder)),
  );

  return results;
}

// ── Delete a file
export default async function deleteFileService(
  filePath,
  bucket = "documents",
) {
  const { error } = await supabase.storage
    .from(BUCKETS[bucket])
    .remove([filePath]);

  if (error) throw new Error(`Delete failed: ${error.message}`);
  return { deleted: filePath };
}
