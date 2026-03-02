import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { QueueService } from "../../queue/queue.service";
import { CreateClipInput, CreateMediaArtifactInput } from "./media.dto";
import {
  completeMultipartUpload,
  createMultipartUpload,
  getSignedMediaUrl,
  getSignedPartUrl,
  getSignedUploadUrl
} from "../../common/s3.client";

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async listArtifacts(sessionId: string) {
    return this.prisma.mediaArtifact.findMany({
      where: { sessionId },
      include: { clips: true },
    });
  }

  async createArtifact(input: CreateMediaArtifactInput) {
    const artifact = await this.prisma.mediaArtifact.create({
      data: {
        sessionId: input.sessionId,
        type: input.type,
        storageKey: input.storageKey,
        status: "uploaded",
      },
    });
    await this.queue.addMediaProcess(artifact.id);
    return artifact;
  }

  async processArtifact(artifactId: string) {
    const artifact = await this.prisma.mediaArtifact.findUniqueOrThrow({
      where: { id: artifactId },
    });
    await this.prisma.mediaArtifact.update({
      where: { id: artifact.id },
      data: { status: "processing" },
    });
    await this.prisma.clip.create({
      data: {
        mediaArtifactId: artifact.id,
        startMs: 0,
        endMs: 60000,
      },
    });
    await this.prisma.mediaArtifact.update({
      where: { id: artifact.id },
      data: { status: "ready" },
    });
    return { processed: true, artifactId };
  }

  async createClip(input: CreateClipInput) {
    return this.prisma.clip.create({
      data: {
        mediaArtifactId: input.mediaArtifactId,
        startMs: input.startMs,
        endMs: input.endMs,
      },
    });
  }

  async listClips(mediaArtifactId: string) {
    return this.prisma.clip.findMany({ where: { mediaArtifactId } });
  }

  async archiveStaleMedia(workspaceId: string, retentionDays: number) {
    const cutoff = new Date(Date.now() - retentionDays * 86400000);
    const artifacts = await this.prisma.mediaArtifact.findMany({
      where: { session: { study: { workspaceId } }, createdAt: { lt: cutoff } },
      select: { id: true },
    });
    if (artifacts.length === 0) {
      return { archived: 0, cutoff, retentionDays };
    }
    const ids = artifacts.map((artifact) => artifact.id);
    await this.prisma.clip.deleteMany({ where: { mediaArtifactId: { in: ids } } });
    const deleted = await this.prisma.mediaArtifact.deleteMany({ where: { id: { in: ids } } });
    return { archived: deleted.count, cutoff, retentionDays };
  }

  async getClipThumbnail(clipId: string) {
    const clip = await this.prisma.clip.findUniqueOrThrow({
      where: { id: clipId },
      include: { mediaArtifact: true },
    });
    const url = await getSignedMediaUrl(clip.mediaArtifact.storageKey);
    return {
      clipId,
      thumbnailUrl: url,
      startMs: clip.startMs,
      endMs: clip.endMs,
    };
  }

  async getSignedUrl(mediaArtifactId: string) {
    const artifact = await this.prisma.mediaArtifact.findUniqueOrThrow({
      where: { id: mediaArtifactId },
    });
    const url = await getSignedMediaUrl(artifact.storageKey);
    return { url };
  }

  async getUploadUrl(storageKey: string, contentType?: string) {
    const url = await getSignedUploadUrl(storageKey, contentType);
    return { url, storageKey };
  }

  async initMultipart(storageKey: string, contentType?: string) {
    return createMultipartUpload(storageKey, contentType);
  }

  async getPartUrl(storageKey: string, uploadId: string, partNumber: number) {
    const url = await getSignedPartUrl(storageKey, uploadId, partNumber);
    return { url, partNumber };
  }

  async completeMultipart(
    storageKey: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
    sessionId: string,
    type: string
  ) {
    await completeMultipartUpload(storageKey, uploadId, parts);
    const artifact = await this.createArtifact({ sessionId, type, storageKey });
    return { completed: true, storageKey, uploadId, artifactId: artifact.id };
  }
}
