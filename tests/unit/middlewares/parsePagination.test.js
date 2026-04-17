import { describe, it, expect, jest } from "@jest/globals";
import { parsePagination } from "../../../src/middlewares/parsePagination.js";

function run(query = {}, options = {}) {
  const req  = { query };
  const next = jest.fn();
  parsePagination(options)(req, {}, next);
  return { pagination: req.pagination, next };
}

describe("parsePagination()", () => {
  it("defaults to page=1, limit=10", () => {
    const { pagination, next } = run();
    expect(pagination).toEqual({ page: 1, limit: 10, skip: 0, take: 10 });
    expect(next).toHaveBeenCalled();
  });

  it("parses explicit page and limit", () => {
    const { pagination } = run({ page: "3", limit: "25" });
    expect(pagination).toEqual({ page: 3, limit: 25, skip: 50, take: 25 });
  });

  it("clamps limit to maxLimit (default 100)", () => {
    const { pagination } = run({ limit: "9999" });
    expect(pagination.limit).toBe(100);
    expect(pagination.take).toBe(100);
  });

  it("respects a custom maxLimit", () => {
    const { pagination } = run({ limit: "50" }, { maxLimit: 20 });
    expect(pagination.limit).toBe(20);
  });

  it("treats limit=0 as not-provided and falls back to the default", () => {
    // parseInt("0") === 0 is falsy; the `|| defaultLimit` branch fires
    const { pagination } = run({ limit: "0" });
    expect(pagination.limit).toBe(10);
  });

  it("clamps page to minimum 1 for negative values", () => {
    const { pagination } = run({ page: "-5" });
    expect(pagination.page).toBe(1);
    expect(pagination.skip).toBe(0);
  });

  it("treats non-numeric page/limit as defaults", () => {
    const { pagination } = run({ page: "abc", limit: "xyz" });
    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(10);
  });

  it("respects a custom defaultLimit", () => {
    const { pagination } = run({}, { defaultLimit: 20 });
    expect(pagination.limit).toBe(20);
    expect(pagination.take).toBe(20);
  });

  it("derives skip correctly for page 2", () => {
    const { pagination } = run({ page: "2", limit: "15" });
    expect(pagination.skip).toBe(15);
    expect(pagination.take).toBe(15);
  });
});
