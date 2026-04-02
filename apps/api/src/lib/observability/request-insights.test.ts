import { describe, expect, it } from "vitest";
import {
  detectNPlusOnePatterns,
  normalizeQuerySignature,
} from "./request-insights";

describe("request insights", () => {
  it("normalizes query signatures to group similar queries", () => {
    expect(
      normalizeQuerySignature(
        "SELECT * FROM students WHERE id = 123 AND email = 'a@example.com'",
      ),
    ).toBe("SELECT * FROM students WHERE id = ? AND email = ?");
  });

  it("detects N+1 patterns when the same normalized query repeats often", () => {
    const patterns = detectNPlusOnePatterns(
      Array.from({ length: 12 }, (_, index) => ({
        query: `SELECT * FROM students WHERE id = ${index}`,
        durationMs: 20 + index,
      })),
    );

    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.count).toBe(12);
    expect(patterns[0]?.signature).toContain("SELECT * FROM students");
  });

  it("ignores sparse query mixes", () => {
    const patterns = detectNPlusOnePatterns([
      { query: "SELECT * FROM students WHERE id = 1", durationMs: 10 },
      { query: "SELECT * FROM gyms WHERE id = 1", durationMs: 12 },
      { query: "SELECT * FROM students WHERE id = 2", durationMs: 11 },
      { query: "SELECT * FROM gyms WHERE id = 2", durationMs: 13 },
    ]);

    expect(patterns).toHaveLength(0);
  });
});
