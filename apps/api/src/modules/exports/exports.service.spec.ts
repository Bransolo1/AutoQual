import { describe, expect, it, vi } from "vitest";
import { ExportsService } from "./exports.service";

describe("ExportsService reporting", () => {
  it("includes segment and theme summaries in JSON export", async () => {
    const prisma = {
      study: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "study-1",
          name: "Study 1",
          status: "active",
          insights: [],
          themes: [{ label: "Theme A" }, { label: "Theme B" }],
          participants: [{ segment: "core" }, { segment: "core" }, { segment: "new" }],
        }),
      },
    };
    const service = new ExportsService(prisma as never);
    const payload = await service.generateJson("study-1");
    expect(payload.segmentSummary).toEqual({ core: 2, new: 1 });
    expect(payload.themeQuantification).toEqual({ "Theme A": 1, "Theme B": 1 });
  });
});
