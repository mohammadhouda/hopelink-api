import { describe, it, expect, jest } from "@jest/globals";
import { asyncHandler } from "../../../src/utils/asyncHandler.js";

function mockRes() {
  const res = {};
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body) => { res._body = body; return res; };
  return res;
}

describe("asyncHandler()", () => {
  it("calls the inner function and passes through success responses", async () => {
    const inner = jest.fn(async (_req, res) => {
      res.status(200).json({ success: true, data: "ok" });
    });
    const handler = asyncHandler(inner);
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(inner).toHaveBeenCalledWith(req, res, next);
    expect(res._status).toBe(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("catches { status, message } service errors and returns failure shape", async () => {
    const handler = asyncHandler(async () => {
      throw { status: 404, message: "Not found" };
    });
    const res = mockRes();

    await handler({}, res, jest.fn());

    expect(res._status).toBe(404);
    expect(res._body).toEqual({ success: false, message: "Not found" });
  });

  it("catches plain Error instances and returns 500", async () => {
    const handler = asyncHandler(async () => {
      throw new Error("Unexpected DB failure");
    });
    const res = mockRes();

    await handler({}, res, jest.fn());

    expect(res._status).toBe(500);
    expect(res._body.message).toBe("Unexpected DB failure");
    expect(res._body.success).toBe(false);
  });

  it("defaults to 500 and generic message when error has no status/message", async () => {
    const handler = asyncHandler(async () => {
      throw {};
    });
    const res = mockRes();

    await handler({}, res, jest.fn());

    expect(res._status).toBe(500);
    expect(res._body.message).toBe("Something went wrong");
  });
});
