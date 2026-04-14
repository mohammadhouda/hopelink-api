import express from "express";
import {
  createPost,
  getFeed,
  getPost,
  deletePost,
  toggleLike,
  getComments,
  addComment,
  deleteComment,
} from "../controllers/post.controller.js";
import { parsePagination } from "../middlewares/parsePagination.js";

const router = express.Router();

// Feed
router.get("/", parsePagination(), getFeed);
router.post("/", createPost);

// Single post
router.get("/:id", getPost);
router.delete("/:id", deletePost);

// Likes
router.post("/:id/like", toggleLike);

// Comments
router.get("/:id/comments", parsePagination(), getComments);
router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);

export default router;
