import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "@/runtime/next-server";
import { POST } from "./route";

const requireAdminMock = vi.fn();
const uploadFoodsFromCSVContentMock = vi.fn();

vi.mock("@/lib/api/middleware/auth.middleware", () => ({
  requireAdmin: (...args: unknown[]) => requireAdminMock(...args),
}));

vi.mock("@/lib/services/upload-foods-from-csv", () => ({
  uploadFoodsFromCSVContent: (...args: unknown[]) =>
    uploadFoodsFromCSVContentMock(...args),
}));

describe("POST /api/foods/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      userId: "admin_123",
      user: { id: "admin_123", role: "ADMIN" },
    });
  });

  it("rejects non-CSV uploads", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(["not,a,csv"], "foods.pdf", { type: "application/pdf" }),
    );

    const request = new Request("http://localhost/api/foods/upload", {
      method: "POST",
      body: formData,
    }) as NextRequest;

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Tipo de arquivo não permitido");
    expect(uploadFoodsFromCSVContentMock).not.toHaveBeenCalled();
  });

  it("accepts valid CSV uploads", async () => {
    uploadFoodsFromCSVContentMock.mockResolvedValue({
      created: 10,
      updated: 0,
      skipped: 0,
    });

    const formData = new FormData();
    formData.set(
      "file",
      new File(["name,calories\nbanana,89"], "foods.csv", {
        type: "text/csv",
      }),
    );
    formData.set("skipDuplicates", "true");
    formData.set("batchSize", "50");

    const request = new Request("http://localhost/api/foods/upload", {
      method: "POST",
      body: formData,
    }) as NextRequest;

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.message).toContain("Upload de alimentos conclu");
    expect(uploadFoodsFromCSVContentMock).toHaveBeenCalledWith(
      "name,calories\nbanana,89",
      {
        skipDuplicates: true,
        batchSize: 50,
      },
    );
  });
});
