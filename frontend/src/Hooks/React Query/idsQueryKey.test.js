import { describe, expect, it } from "vitest";
import { idsQueryKeySuffix } from "./idsQueryKey.js";

describe("keying a query on a set of ids", () => {
  it("gives the same answer whatever order they arrive in", () => {
    expect(idsQueryKeySuffix([35, 34])).toBe(idsQueryKeySuffix([34, 35]));
  });

  it("gives the same answer for numbers and strings", () => {
    expect(idsQueryKeySuffix([34, 35])).toBe(idsQueryKeySuffix(["34", "35"]));
  });

  it("counts a repeated id once", () => {
    expect(idsQueryKeySuffix([34, 34, 35])).toBe(idsQueryKeySuffix([34, 35]));
  });

  it("takes a set as readily as a list", () => {
    expect(idsQueryKeySuffix(new Set([34, 35]))).toBe(
      idsQueryKeySuffix([34, 35]),
    );
  });

  it("leaves out ids that are not there", () => {
    expect(idsQueryKeySuffix([34, null, undefined, 0, ""])).toBe("34");
  });

  it("answers for nothing at all", () => {
    expect(idsQueryKeySuffix()).toBe("");
    expect(idsQueryKeySuffix([])).toBe("");
  });
});
