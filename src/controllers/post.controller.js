import { success, failure } from "../utils/response.js";
import * as postService from "../services/post.service.js";

export async function createPost(req, res) {
  try {
    const post = await postService.createPost(req.user.id, req.body);
    return success(res, post, "Post created", 201);
  } catch (err) {
    return failure(res, err.message || "Failed to create post", err.status || 500);
  }
}

export async function getFeed(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await postService.getFeed({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      userId: req.user.id,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch feed", err.status || 500);
  }
}

export async function getPost(req, res) {
  try {
    const post = await postService.getPostById(parseInt(req.params.id), req.user.id);
    return success(res, post);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch post", err.status || 500);
  }
}

export async function deletePost(req, res) {
  try {
    await postService.deletePost(parseInt(req.params.id), req.user.id);
    return success(res, null, "Post deleted");
  } catch (err) {
    return failure(res, err.message || "Failed to delete post", err.status || 500);
  }
}

export async function toggleLike(req, res) {
  try {
    const result = await postService.toggleLike(parseInt(req.params.id), req.user.id);
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to toggle like", err.status || 500);
  }
}

export async function getComments(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await postService.getComments(parseInt(req.params.id), {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch comments", err.status || 500);
  }
}

export async function addComment(req, res) {
  try {
    const comment = await postService.addComment(
      parseInt(req.params.id),
      req.user.id,
      req.body.content,
    );
    return success(res, comment, "Comment added", 201);
  } catch (err) {
    return failure(res, err.message || "Failed to add comment", err.status || 500);
  }
}

export async function deleteComment(req, res) {
  try {
    await postService.deleteComment(parseInt(req.params.commentId), req.user.id);
    return success(res, null, "Comment deleted");
  } catch (err) {
    return failure(res, err.message || "Failed to delete comment", err.status || 500);
  }
}
