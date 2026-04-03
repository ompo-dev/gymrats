import { describe, expect, it } from "vitest";
import { parseJsonArray, parseJsonSafe } from "./json";

describe("json helpers", () => {
  it("parseJsonSafe returns parsed object when JSON is valid", () => {
    expect(parseJsonSafe<{ open: string }>('{"open":"06:00"}')).toEqual({
      open: "06:00",
    });
  });

  it("parseJsonSafe returns null when JSON is malformed", () => {
    expect(parseJsonSafe("{invalid")).toBeNull();
  });

  it("parseJsonArray returns [] when value is malformed or not an array", () => {
    expect(parseJsonArray<string>("{invalid")).toEqual([]);
    expect(parseJsonArray<string>('{"key":"value"}')).toEqual([]);
  });
});
