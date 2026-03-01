import { describe, expect, it, vi } from "vitest";
import { MediaService } from "./media.service";

describe("MediaService", () => {
  it("creates a clip during artifact processing", async () => {
    const prisma = {
      mediaArtifact: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "artifact-1" }),
      },
      clip: {
        create: vi.fn().mockResolvedValue({ id: "clip-1" }),
      },
    };
    const queue = { addMediaProcess: vi.fn() };
    const service = new MediaService(prisma as never, queue as never);

    const result = await service.processArtifact("artifact-1");

    expect(prisma.mediaArtifact.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: "artifact-1" } });
    expect(prisma.clip.create).toHaveBeenCalledWith({
      data: { mediaArtifactId: "artifact-1", startMs: 0, endMs: 60000 },
    });
    expect(result).toEqual({ processed: true, artifactId: "artifact-1" });
  });
});
