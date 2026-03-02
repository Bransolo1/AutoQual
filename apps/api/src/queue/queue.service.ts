import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT || 6379),
};

@Injectable()
export class QueueService implements OnModuleDestroy {
  private pipeline: Queue;

  constructor() {
    this.pipeline = new Queue("pipeline", { connection });
  }

  async addMediaProcess(artifactId: string) {
    return this.pipeline.add("media.process", { artifactId });
  }

  async addTranscriptRedaction(transcriptId: string) {
    return this.pipeline.add("transcript.redact", { transcriptId });
  }

  async addTranscriptionJob(sessionId: string) {
    return this.pipeline.add("transcription.generate", { sessionId });
  }

  async addThemeCoding(studyId: string, transcriptText: string) {
    return this.pipeline.add("theme.coding", { studyId, transcriptText });
  }

  async addRetentionArchive(workspaceId: string) {
    return this.pipeline.add("retention.archive", { workspaceId });
  }

  async addAuditRetentionSchedule(workspaceId: string) {
    return this.pipeline.add(
      "audit.retention",
      { workspaceId },
      { repeat: { every: 24 * 60 * 60 * 1000 }, jobId: `audit.retention.${workspaceId}` },
    );
  }

  async removeAuditRetentionSchedule(workspaceId: string) {
    await this.pipeline.removeRepeatable("audit.retention", { every: 24 * 60 * 60 * 1000 }, `audit.retention.${workspaceId}`);
  }

  async addTokenRevocationPurge() {
    return this.pipeline.add("token.revocation.purge", {}, { repeat: { every: 24 * 60 * 60 * 1000 } });
  }

  async addAlertsRefreshSchedule(workspaceId: string) {
    return this.pipeline.add(
      "alerts.refresh",
      { workspaceId },
      { repeat: { every: 24 * 60 * 60 * 1000 }, jobId: `alerts.refresh.${workspaceId}` },
    );
  }

  async removeAlertsRefreshSchedule(workspaceId: string) {
    await this.pipeline.removeRepeatable("alerts.refresh", { every: 24 * 60 * 60 * 1000 }, `alerts.refresh.${workspaceId}`);
  }

  async onModuleDestroy() {
    await this.pipeline.close();
  }
}
