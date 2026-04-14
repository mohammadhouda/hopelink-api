import { success } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as postService from "../services/post.service.js";

export const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user.id, req.body);
  return success(res, post, "Post created", 201);
});

export const getFeed = asyncHandler(async (req, res) => {
  const result = await postService.getFeed({
    page: req.pagination.page,
    limit: req.pagination.limit,
    userId: req.user.id,
  });
  return success(res, result);
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(parseInt(req.params.id), req.user.id);
  return success(res, post);
});

export const deletePost = asyncHandler(async (req, res) => {
  await postService.deletePost(parseInt(req.params.id), req.user.id);
  return success(res, null, "Post deleted");
});

export const toggleLike = asyncHandler(async (req, res) => {
  const result = await postService.toggleLike(parseInt(req.params.id), req.user.id);
  return success(res, result);
});

export const getComments = asyncHandler(async (req, res) => {
  const result = await postService.getComments(parseInt(req.params.id), {
    page: req.pagination.page,
    limit: req.pagination.limit,
  });
  return success(res, result);
});

export const addComment = asyncHandler(async (req, res) => {
  const comment = await postService.addComment(
    parseInt(req.params.id),
    req.user.id,
    req.body.content,
  );
  return success(res, comment, "Comment added", 201);
});

export const deleteComment = asyncHandler(async (req, res) => {
  await postService.deleteComment(parseInt(req.params.commentId), req.user.id);
  return success(res, null, "Comment deleted");
});
