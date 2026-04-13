import { failure } from "./response.js";

/**
 * Wraps an async controller function so it never needs its own try/catch.
 *
 * Services throw plain objects `{ status, message }` for expected errors, or
 * Error instances for unexpected ones. This handler normalises both shapes and
 * calls failure() with the right HTTP status code.
 *
 * Usage:
 *   export const getUser = asyncHandler(async (req, res) => {
 *     const user = await userService.getById(req.params.id);
 *     return success(res, user);
 *   });
 */
export function asyncHandler(fn) {
  return async function handler(req, res, next) {
    try {
      await fn(req, res, next);
    } catch (err) {
      // Services throw { status, message }
      const status  = err?.status  ?? 500;
      const message = err?.message ?? "Something went wrong";
      return failure(res, message, status);
    }
  };
}
