import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTrustArtifactInput, UpdateTrustArtifactInput } from "./trust-center.dto";
import { getSignedMediaUrl, getSignedUploadUrl } from "../../common/s3.client";

@Injectable()
export class TrustCenterService {
  constructor(private readonly prisma: PrismaService) {}

  list(workspaceId: string) {
    return this.prisma.trustArtifact.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(input: CreateTrustArtifactInput) {
    const artifact = await this.prisma.trustArtifact.create({
      data: {
        workspaceId: input.workspaceId,
        category: input.category,
        status: input.status,
        filename: input.filename,
        storageKey: input.storageKey,
        notes: input.notes,
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: "system",
        action: "trust_artifact.created",
        entityType: "trust_artifact",
        entityId: artifact.id,
        metadata: { category: input.category, status: input.status },
      },
    });
    return artifact;
  }

  async update(id: string, input: UpdateTrustArtifactInput) {
    const artifact = await this.prisma.trustArtifact.findUniqueOrThrow({ where: { id } });
    const updated = await this.prisma.trustArtifact.update({
      where: { id },
      data: {
        status: input.status ?? undefined,
        notes: input.notes ?? undefined,
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        workspaceId: artifact.workspaceId,
        actorUserId: "system",
        action: "trust_artifact.updated",
        entityType: "trust_artifact",
        entityId: artifact.id,
        metadata: { status: input.status ?? null },
      },
    });
    return updated;
  }

  async getSignedUrl(id: string) {
    const artifact = await this.prisma.trustArtifact.findUniqueOrThrow({ where: { id } });
    const url = await getSignedMediaUrl(artifact.storageKey);
    return { url, storageKey: artifact.storageKey, filename: artifact.filename };
  }

  async getUploadUrl(storageKey: string, contentType?: string) {
    const url = await getSignedUploadUrl(storageKey, contentType);
    return { url, storageKey };
  }
}
