import { describe, it, expect } from "@jest/globals";
import { success, failure } from "../../../src/utils/response.js";

function mockRes() {
  const res = {};
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body) => { res._body = body; return res; };
  return res;
}

describe("success()", () => {
  it("sets status 200 and success:true by default", () => {
    const res = mockRes();
    success(res, { id: 1 });
    expect(res._status).toBe(200);
    expect(res._body).toEqual({ success: true, message: "Success", data: { id: 1 } });
  });

  it("uses the provided status and message", () => {
    const res = mockRes();
    success(res, null, "Created", 201);
    expect(res._status).toBe(201);
    expect(res._body.message).toBe("Created");
    expect(res._body.data).toBeNull();
  });

  it("defaults data to null when omitted", () => {
    const res = mockRes();
    success(res);
    expect(res._body.data).toBeNull();
  });
});

describe("failure()", () => {
  it("sets status 500 and success:false by default", () => {
    const res = mockRes();
    failure(res);
    expect(res._status).toBe(500);
    expect(res._body).toEqual({ success: false, message: "Something went wrong" });
  });

  it("uses the provided message and status", () => {
    const res = mockRes();
    failure(res, "Not found", 404);
    expect(res._status).toBe(404);
    expect(res._body.message).toBe("Not found");
    expect(res._body.success).toBe(false);
  });
});
