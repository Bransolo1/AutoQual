import "./otel";
import { Queue, Worker } from "bullmq";
import { deterministicInsightAdapter } from "../../../packages/ai-adapters/src/mock";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT || 6379),
};

const API_BASE = process.env.API_URL || "http://localhost:4000";
const shouldInitQueues = process.env.NODE_ENV !== "test";
const pipelineQueue = shouldInitQueues ? new Queue("pipeline", { connection }) : null;
const API_HEADERS = {
  "Content-Type": "application/json",
  "x-workspace-id": "demo-workspace-id",
  "x-user-id": "system",
  "x-role": "admin",
};

export const redactPII = (text: string) => {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const phoneRegex = /(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;
  const urlRegex = /\bhttps?:\/\/\S+/gi;
  const replacements: { type: string; regex: RegExp }[] = [
    { type: "email", regex: emailRegex },
    { type: "phone", regex: phoneRegex },
    { type: "url", regex: urlRegex },
  ];
  let redacted = text;
  const counts: Record<string, number> = {};
  const offsets: Array<{ type: string; start: number; end: number }> = [];
  replacements.forEach(({ type, regex }) => {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(redacted)) !== null) {
      offsets.push({
        type,
        start: match.index,
        end: match.index + match[0].length,
      });
      counts[type] = (counts[type] ?? 0) + 1;
    }
    if (counts[type]) {
      redacted = redacted.replace(regex, `[REDACTED_${type.toUpperCase()}]`);
    }
  });
  return {
    redacted,
    piiDetected: Object.keys(counts).length > 0,
    metadata: { counts },
    offsets,
  };
};

const synthesizeTranscript = (seed: string, artifactCount: number) => {
  const base = seed.replace(/[^a-z0-9]+/gi, " ").trim();
  const tokens = base.split(/\s+/).filter(Boolean);
  const title = tokens.slice(0, 6).join(" ") || "participant response";
  return `Transcript from ${artifactCount} artifact(s): ${title}.`;
};

export async function handlePipelineJob(
  job: { name: string; data: Record<string, unknown> },
  options?: { enqueue?: (name: string, data: Record<string, unknown>) => Promise<unknown> },
) {
  if (job.name === "generate-insight") {
    const result = deterministicInsightAdapter(job.data as Record<string, unknown>);
    const studyId = (job.data as { studyId?: string }).studyId;
    const transcriptText = (job.data as { transcriptText?: string }).transcriptText ?? "";
    if (studyId) {
      const insightRes = await fetch(`${API_BASE}/insights/generate`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ studyId, transcriptText }),
      });
      const insight = insightRes.ok ? ((await insightRes.json()) as { id?: string }) : null;
      if (insight?.id) {
        await fetch(`${API_BASE}/search/index/insight`, {
          method: "POST",
          headers: API_HEADERS,
          body: JSON.stringify({ insightId: insight.id }),
        });
      }
      await fetch(`${API_BASE}/approvals`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          linkedEntityType: "insight_set",
          linkedEntityId: studyId,
          status: "requested",
          requestedByUserId: "system",
        }),
      });
      const studyRes = await fetch(`${API_BASE}/studies/${studyId}`, { headers: API_HEADERS });
      const study = studyRes.ok ? ((await studyRes.json()) as { workspaceId?: string }) : null;
      if (study?.workspaceId) {
        const enqueue =
          options?.enqueue ??
          ((name, data) => {
            if (!pipelineQueue) {
              return Promise.reject(new Error("pipelineQueue not initialized"));
            }
            return pipelineQueue.add(name, data);
          });
        await enqueue("dashboard.refresh", { workspaceId: study.workspaceId, studyId });
      }
    }
    return result;
  }
  if (job.name === "media.process") {
    const { artifactId } = job.data as { artifactId: string };
    const res = await fetch(`${API_BASE}/media/artifacts/${artifactId}/process`, {
      method: "POST",
      headers: API_HEADERS,
    });
    const data = await res.json().catch(() => ({}));
    return { processed: res.ok, artifactId, data };
  }
  if (job.name === "transcript.redact") {
    const { transcriptId } = job.data as { transcriptId: string };
    const transcriptRes = await fetch(`${API_BASE}/transcripts/${transcriptId}`, {
      headers: API_HEADERS,
    });
    if (!transcriptRes.ok) {
      return { processed: false, transcriptId, reason: "not_found" };
    }
    const transcript = (await transcriptRes.json()) as { content?: string; sessionId?: string };
    const content = transcript.content ?? "";
    const redaction = redactPII(content);
    const redactRes = await fetch(`${API_BASE}/transcripts/${transcriptId}/redact`, {
      method: "PATCH",
      headers: API_HEADERS,
      body: JSON.stringify({
        redactedContent: redaction.redacted,
        piiDetected: redaction.piiDetected,
        piiMetadata: redaction.metadata,
        redactionOffsets: redaction.offsets,
      }),
    });
    if (redactRes.ok && transcript.sessionId) {
      const sessionRes = await fetch(`${API_BASE}/sessions/${transcript.sessionId}`, {
        headers: API_HEADERS,
      });
      const session = sessionRes.ok ? ((await sessionRes.json()) as { studyId?: string }) : null;
      if (session?.studyId) {
        const enqueue =
          options?.enqueue ??
          ((name, data) => {
            if (!pipelineQueue) {
              return Promise.reject(new Error("pipelineQueue not initialized"));
            }
            return pipelineQueue.add(name, data);
          });
        await enqueue("generate-insight", {
          studyId: session.studyId,
          transcriptText: redaction.redacted,
        });
        await enqueue("theme.coding", {
          studyId: session.studyId,
          transcriptText: redaction.redacted,
        });
      }
    }
    return { processed: redactRes.ok, transcriptId, piiDetected: redaction.piiDetected };
  }
  if (job.name === "transcription.generate") {
    const { sessionId } = job.data as { sessionId: string };
    const artifactsRes = await fetch(`${API_BASE}/media/artifacts?sessionId=${sessionId}`, {
      headers: API_HEADERS,
    });
    const artifacts = artifactsRes.ok
      ? ((await artifactsRes.json()) as Array<{ id: string; storageKey?: string }>)
      : [];
    if (artifacts.length === 0) {
      return { processed: false, sessionId, reason: "no_media_artifacts" };
    }
    const primary = artifacts[0];
    const signedRes = await fetch(`${API_BASE}/media/artifacts/${primary.id}/signed-url`, {
      headers: API_HEADERS,
    });
    const signed = signedRes.ok ? ((await signedRes.json()) as { url?: string }) : null;

    // C2: real transcription via Deepgram if configured
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    if (DEEPGRAM_API_KEY && signed?.url) {
      try {
        const dgRes = await fetch(
          "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&punctuate=true",
          {
            method: "POST",
            headers: {
              Authorization: `Token ${DEEPGRAM_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: signed.url }),
          },
        );
        if (dgRes.ok) {
          type DgWord = { word: string; start: number; end: number; speaker?: number };
          type DgResult = { results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string; words?: DgWord[] }> }>; diarization?: Array<{ speaker: number; start: number; end: number }> } };
          const dg = (await dgRes.json()) as DgResult;
          const alt = dg.results?.channels?.[0]?.alternatives?.[0];
          if (alt?.transcript && alt.words) {
            const content = alt.transcript;
            const wordTimestamps = alt.words.map((w) => ({
              word: w.word,
              startMs: Math.round(w.start * 1000),
              endMs: Math.round(w.end * 1000),
            }));
            const totalEnd = wordTimestamps.length ? wordTimestamps[wordTimestamps.length - 1].endMs : 0;
            // Build speaker diarization from word-level speaker tags
            const speakerMap = new Map<number, { startMs: number; endMs: number }>();
            for (const w of alt.words) {
              const spk = w.speaker ?? 0;
              const existing = speakerMap.get(spk);
              const startMs = Math.round(w.start * 1000);
              const endMs = Math.round(w.end * 1000);
              if (!existing) speakerMap.set(spk, { startMs, endMs });
              else speakerMap.set(spk, { startMs: Math.min(existing.startMs, startMs), endMs: Math.max(existing.endMs, endMs) });
            }
            const diarization = [...speakerMap.entries()].map(([speaker, range]) => ({
              speaker: speaker === 0 ? "participant" : `speaker_${speaker}`,
              ...range,
              confidence: 0.95,
            }));
            const transcriptRes = await fetch(`${API_BASE}/transcripts`, {
              method: "POST",
              headers: API_HEADERS,
              body: JSON.stringify({ sessionId, content, wordTimestamps, diarization }),
            });
            return { processed: transcriptRes.ok, sessionId, wordCount: wordTimestamps.length, provider: "deepgram" };
          }
        }
      } catch {
        // fall through to synthetic transcript
      }
    }

    // Fallback: synthetic transcript
    const seed = primary.storageKey ?? signed?.url ?? sessionId;
    const content = synthesizeTranscript(seed, artifacts.length);
    const words = content.match(/\S+/g) ?? [];
    const wordDurationMs = 500;
    const wordGapMs = 80;
    const wordTimestamps = words.map((word, index) => {
      const startMs = index * (wordDurationMs + wordGapMs);
      return { word, startMs, endMs: startMs + wordDurationMs };
    });
    const totalEnd = wordTimestamps.length
      ? wordTimestamps[wordTimestamps.length - 1].endMs
      : 0;
    const diarization = [
      { speaker: "participant", startMs: 0, endMs: totalEnd, confidence: 0.6 },
    ];
    const transcriptRes = await fetch(`${API_BASE}/transcripts`, {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({
        sessionId,
        content,
        wordTimestamps,
        diarization,
      }),
    });
    return { processed: transcriptRes.ok, sessionId, wordCount: words.length, provider: "synthetic" };
  }
  if (job.name === "theme.coding") {
    const { studyId, transcriptText } = job.data as { studyId: string; transcriptText: string };
    const words = transcriptText.split(/\s+/).filter(Boolean);
    const seed = words.slice(0, 3).join(" ") || "participant feedback";
    const themes = [
      `Theme: ${seed}`,
      "Theme: pain points",
      "Theme: desired outcomes",
    ];
    const created = [];
    for (const label of themes) {
      const res = await fetch(`${API_BASE}/themes`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ studyId, label }),
      });
      created.push(res.ok);
    }
    return { processed: true, studyId, createdCount: created.filter(Boolean).length };
  }
  if (job.name === "retention.archive") {
    const { workspaceId } = job.data as { workspaceId: string };
    const workspaceRes = await fetch(`${API_BASE}/workspaces/${workspaceId}`, { headers: API_HEADERS });
    const workspace = workspaceRes.ok
      ? ((await workspaceRes.json()) as { retentionDays?: number; piiRedactionEnabled?: boolean })
      : null;
    const retentionDays = workspace?.retentionDays ?? 365;
    const res = await fetch(
      `${API_BASE}/media/retention/archive?workspaceId=${workspaceId}&retentionDays=${retentionDays}`,
      { method: "POST", headers: API_HEADERS },
    );
    const payload = res.ok ? await res.json().catch(() => ({})) : {};
    return { processed: res.ok, workspaceId, retentionDays, archived: payload.archived ?? 0 };
  }
  if (job.name === "audit.retention") {
    const { workspaceId } = job.data as { workspaceId: string };
    const workspaceRes = await fetch(`${API_BASE}/workspaces/${workspaceId}`, { headers: API_HEADERS });
    const workspace = workspaceRes.ok
      ? ((await workspaceRes.json()) as { auditRetentionEnabled?: boolean; auditRetentionDays?: number })
      : null;
    if (!workspace?.auditRetentionEnabled) {
      return { processed: true, workspaceId, skipped: "audit_retention_disabled" };
    }
    const retentionDays = workspace?.auditRetentionDays ?? 365;
    const res = await fetch(`${API_BASE}/audit/retention-run?workspaceId=${workspaceId}&retentionDays=${retentionDays}`, {
      method: "POST",
      headers: API_HEADERS,
    });
    const payload = res.ok ? await res.json().catch(() => ({})) : {};
    return { processed: res.ok, workspaceId, retentionDays, deleted: payload.deleted ?? 0 };
  }
  if (job.name === "dashboard.refresh") {
    const { workspaceId, studyId } = job.data as { workspaceId: string; studyId?: string };
    const res = await fetch(
      `${API_BASE}/ops/dashboard/refresh?workspaceId=${workspaceId}${
        studyId ? `&studyId=${studyId}` : ""
      }`,
      { method: "POST", headers: API_HEADERS },
    );
    const payload = res.ok ? await res.json().catch(() => ({})) : {};
    return { processed: res.ok, workspaceId, studyId, ...payload };
  }
  if (job.name === "token.revocation.purge") {
    const res = await fetch(`${API_BASE}/auth/tokens/purge`, {
      method: "POST",
      headers: API_HEADERS,
    });
    return { processed: res.ok };
  }
  if (job.name === "alerts.refresh") {
    const { workspaceId } = job.data as { workspaceId: string };
    const res = await fetch(`${API_BASE}/ops/alerts/refresh?workspaceId=${workspaceId}`, {
      method: "POST",
      headers: API_HEADERS,
    });
    const payload = res.ok ? await res.json().catch(() => ({})) : {};
    return { processed: res.ok, workspaceId, ...payload };
  }
  return { status: "ignored", payload: job.data };
}

if (shouldInitQueues) {
  new Worker(
    "pipeline",
    async (job) => handlePipelineJob({ name: job.name, data: job.data as Record<string, unknown> }),
    { connection },
  );
}

export async function enqueueInsightJob(payload: Record<string, unknown>) {
  if (!pipelineQueue) {
    throw new Error("pipelineQueue not initialized");
  }
  return pipelineQueue.add("generate-insight", payload);
}
