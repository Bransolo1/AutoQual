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

  async addTokenRevocationPurge() {
    return this.pipeline.add("token.revocation.purge", {}, { repeat: { every: 24 * 60 * 60 * 1000 } });
  }

  async onModuleDestroy() {
    await this.pipeline.close();
  }
}
