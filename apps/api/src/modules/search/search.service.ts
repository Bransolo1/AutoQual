import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SearchAllInput, SearchInsightsInput } from "./search.dto";

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  private buildSnippet(text: string, query: string, maxLength = 180) {
    const normalized = text ?? "";
    const lower = normalized.toLowerCase();
    const needle = query.toLowerCase();
    const index = lower.indexOf(needle);
    if (index === -1) {
      const trimmed = normalized.trim();
      return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}…` : trimmed;
    }
    const start = Math.max(index - 40, 0);
    const end = Math.min(index + needle.length + 80, normalized.length);
    const snippet = normalized.slice(start, end).trim();
    return `${start > 0 ? "…" : ""}${snippet}${end < normalized.length ? "…" : ""}`;
  }

  private getSearchUrl() {
    return process.env.OPENSEARCH_URL;
  }

  async indexInsight(insightId: string) {
    const insight = await this.prisma.insight.findUniqueOrThrow({
      where: { id: insightId },
      include: { study: true },
    });

    const payload = {
      id: insight.id,
      statement: insight.statement,
      tags: insight.tags,
      studyId: insight.studyId,
      confidenceScore: insight.confidenceScore,
    };

    const url = this.getSearchUrl();
    if (!url) {
      return { indexed: false, reason: "OPENSEARCH_URL not configured", payload };
    }

    try {
      await fetch(`${url}/insights/_doc/${insight.id}`, {
        method: "PUT",
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      return { indexed: true, payload };
    } catch (error) {
      return { indexed: false, reason: "index_failed", error: String(error) };
    }
  }

  async indexTranscript(transcriptId: string) {
    const transcript = await this.prisma.transcript.findUniqueOrThrow({
      where: { id: transcriptId },
      include: { session: true },
    });
    const payload = {
      id: transcript.id,
      type: "transcript",
      studyId: transcript.session.studyId,
      sessionId: transcript.sessionId,
      content: transcript.redactedContent ?? transcript.content,
    };
    const url = this.getSearchUrl();
    if (!url) {
      return { indexed: false, reason: "OPENSEARCH_URL not configured", payload };
    }
    try {
      await fetch(`${url}/transcripts/_doc/${transcript.id}`, {
        method: "PUT",
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      return { indexed: true, payload };
    } catch (error) {
      return { indexed: false, reason: "index_failed", error: String(error) };
    }
  }

  async indexTheme(themeId: string) {
    const theme = await this.prisma.theme.findUniqueOrThrow({
      where: { id: themeId },
    });
    const payload = {
      id: theme.id,
      type: "theme",
      studyId: theme.studyId,
      label: theme.label,
    };
    const url = this.getSearchUrl();
    if (!url) {
      return { indexed: false, reason: "OPENSEARCH_URL not configured", payload };
    }
    try {
      await fetch(`${url}/themes/_doc/${theme.id}`, {
        method: "PUT",
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      return { indexed: true, payload };
    } catch (error) {
      return { indexed: false, reason: "index_failed", error: String(error) };
    }
  }

  async indexStory(storyId: string) {
    const story = await this.prisma.story.findUniqueOrThrow({ where: { id: storyId } });
    const payload = {
      id: story.id,
      type: "story",
      studyId: story.studyId,
      title: story.title,
      summary: story.summary ?? "",
      content: story.content,
    };
    const url = this.getSearchUrl();
    if (!url) {
      return { indexed: false, reason: "OPENSEARCH_URL not configured", payload };
    }
    try {
      await fetch(`${url}/stories/_doc/${story.id}`, {
        method: "PUT",
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      return { indexed: true, payload };
    } catch (error) {
      return { indexed: false, reason: "index_failed", error: String(error) };
    }
  }

  async searchInsights(input: SearchInsightsInput) {
    const query = input.query?.trim();
    if (!query) {
      return { results: [], reason: "query_required" };
    }
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
    const url = this.getSearchUrl();
    if (!url) {
      const results = await this.prisma.insight.findMany({
        where: {
          studyId: input.studyId ?? undefined,
          OR: [
            { statement: { contains: query, mode: "insensitive" } },
            { businessImplication: { contains: query, mode: "insensitive" } },
            { tags: { has: query } },
          ],
        },
        take: limit,
      });
      return { results, indexed: false };
    }
    try {
      const res = await fetch(`${url}/insights/_search`, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({
          size: limit,
          query: {
            bool: {
              must: [{ multi_match: { query, fields: ["statement", "tags", "studyId"] } }],
              filter: input.studyId ? [{ term: { studyId: input.studyId } }] : [],
            },
          },
        }),
      });
      const data = await res.json();
      const hits = data?.hits?.hits ?? [];
      if (hits.length > 0) {
        return {
          indexed: true,
          results: hits.map((hit: { _source?: Record<string, unknown> }) => hit._source ?? {}),
        };
      }
    } catch {
      // fall through to Prisma
    }
    const results = await this.prisma.insight.findMany({
      where: {
        studyId: input.studyId ?? undefined,
        OR: [
          { statement: { contains: query, mode: "insensitive" } },
          { businessImplication: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ],
      },
      take: limit,
    });
    return { results, indexed: false };
  }

  async searchInsightsWithEvidence(input: SearchInsightsInput) {
    const base = await this.searchInsights(input);
    const ids = (base.results as Array<Record<string, unknown>>)
      .map((result) => String(result.id ?? ""))
      .filter(Boolean);
    if (!ids.length) {
      return { ...base, evidence: [] };
    }
    const insights = await this.prisma.insight.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        statement: true,
        supportingTranscriptSpans: true,
        supportingVideoClips: true,
      },
    });
    const spanIds = insights
      .flatMap((insight) =>
        Array.isArray(insight.supportingTranscriptSpans)
          ? (insight.supportingTranscriptSpans as string[])
          : [],
      )
      .filter(Boolean);
    const spans = spanIds.length
      ? await this.prisma.transcriptSpan.findMany({
          where: { id: { in: spanIds } },
          select: { id: true, transcriptId: true, startMs: true, endMs: true, text: true },
        })
      : [];
    const spanLookup = new Map(spans.map((span) => [span.id, span]));
    return {
      ...base,
      evidence: insights.map((insight) => ({
        id: insight.id,
        statement: insight.statement,
        transcriptSpans: insight.supportingTranscriptSpans,
        videoClips: insight.supportingVideoClips,
        transcriptSnippets: (
          Array.isArray(insight.supportingTranscriptSpans)
            ? (insight.supportingTranscriptSpans as string[])
            : []
        ).map((spanId) => {
          const span = spanLookup.get(spanId);
          if (!span) return { spanId };
          return {
            spanId,
            transcriptId: span.transcriptId,
            startMs: span.startMs,
            endMs: span.endMs,
            text: span.text,
          };
        }),
      })),
    };
  }

  async searchAll(input: SearchAllInput) {
    const query = input.query?.trim();
    if (!query) {
      return { results: [], reason: "query_required" };
    }
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
    const url = this.getSearchUrl();
    if (!url) {
      const [insights, transcripts, themes, stories] = await Promise.all([
        this.prisma.insight.findMany({
          where: {
            studyId: input.studyId ?? undefined,
            OR: [
              { statement: { contains: query, mode: "insensitive" } },
              { businessImplication: { contains: query, mode: "insensitive" } },
              { tags: { has: query } },
            ],
          },
          take: limit,
        }),
        this.prisma.transcript.findMany({
          where: {
            session: { studyId: input.studyId ?? undefined },
            OR: [
              { content: { contains: query, mode: "insensitive" } },
              { redactedContent: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
        this.prisma.theme.findMany({
          where: {
            studyId: input.studyId ?? undefined,
            label: { contains: query, mode: "insensitive" },
          },
          take: limit,
        }),
        this.prisma.story.findMany({
          where: {
            studyId: input.studyId ?? undefined,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { summary: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
      ]);
      return {
        indexed: false,
        results: [
          ...insights.map((insight) => ({
            type: "insight",
            id: insight.id,
            studyId: insight.studyId,
            snippet: this.buildSnippet(insight.statement, query),
          })),
          ...transcripts.map((transcript) => ({
            type: "transcript",
            id: transcript.id,
            studyId: input.studyId ?? null,
            snippet: this.buildSnippet(transcript.redactedContent ?? transcript.content, query),
          })),
          ...themes.map((theme) => ({
            type: "theme",
            id: theme.id,
            studyId: theme.studyId,
            snippet: theme.label,
          })),
          ...stories.map((story) => ({
            type: "story",
            id: story.id,
            studyId: story.studyId,
            snippet: this.buildSnippet(`${story.title} ${story.summary ?? ""} ${story.content}`, query),
          })),
        ].slice(0, limit),
      };
    }
    try {
      const [insightRes, transcriptRes, themeRes, storyRes] = await Promise.all([
        fetch(`${url}/insights/_search`, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify({
            size: limit,
            query: {
              bool: {
                must: [{ multi_match: { query, fields: ["statement", "tags", "studyId"] } }],
                filter: input.studyId ? [{ term: { studyId: input.studyId } }] : [],
              },
            },
          }),
        }),
        fetch(`${url}/transcripts/_search`, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify({
            size: limit,
            query: {
              bool: {
                must: [{ multi_match: { query, fields: ["content", "studyId"] } }],
                filter: input.studyId ? [{ term: { studyId: input.studyId } }] : [],
              },
            },
          }),
        }),
        fetch(`${url}/themes/_search`, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify({
            size: limit,
            query: {
              bool: {
                must: [{ multi_match: { query, fields: ["label", "studyId"] } }],
                filter: input.studyId ? [{ term: { studyId: input.studyId } }] : [],
              },
            },
          }),
        }),
        fetch(`${url}/stories/_search`, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify({
            size: limit,
            query: {
              bool: {
                must: [{ multi_match: { query, fields: ["title", "summary", "content", "studyId"] } }],
                filter: input.studyId ? [{ term: { studyId: input.studyId } }] : [],
              },
            },
          }),
        }),
      ]);
      const parse = async (res: Response) => {
        const data = await res.json().catch(() => ({}));
        return data?.hits?.hits?.map((hit: { _source?: Record<string, unknown> }) => hit._source ?? {}) ?? [];
      };
      const [insightHits, transcriptHits, themeHits, storyHits] = await Promise.all([
        parse(insightRes),
        parse(transcriptRes),
        parse(themeRes),
        parse(storyRes),
      ]);
      return {
        indexed: true,
        results: [
          ...insightHits.map((hit: any) => ({
            type: "insight",
            id: String(hit.id ?? ""),
            studyId: hit.studyId,
            snippet: this.buildSnippet(String(hit.statement ?? ""), query),
          })),
          ...transcriptHits.map((hit: any) => ({
            type: "transcript",
            id: String(hit.id ?? ""),
            studyId: hit.studyId,
            snippet: this.buildSnippet(String(hit.content ?? ""), query),
          })),
          ...themeHits.map((hit: any) => ({
            type: "theme",
            id: String(hit.id ?? ""),
            studyId: hit.studyId,
            snippet: String(hit.label ?? ""),
          })),
          ...storyHits.map((hit: any) => ({
            type: "story",
            id: String(hit.id ?? ""),
            studyId: hit.studyId,
            snippet: this.buildSnippet(String(hit.content ?? hit.title ?? ""), query),
          })),
        ].slice(0, limit),
      };
    } catch (error) {
      return { results: [], indexed: false, reason: "search_failed", error: String(error) };
    }
  }

  async health() {
    const url = process.env.OPENSEARCH_URL;
    if (!url) {
      return { status: "disabled" };
    }
    try {
      const res = await fetch(`${url}/_cluster/health`, {
        method: "GET",
        headers: this.buildHeaders(),
      });
      const payload = await res.json().catch(() => ({}));
      return {
        status: res.ok ? "ok" : "error",
        code: res.status,
        payload,
      };
    } catch (error) {
      return { status: "error", error: String(error) };
    }
  }

  private buildHeaders() {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const username = process.env.OPENSEARCH_USERNAME;
    const password = process.env.OPENSEARCH_PASSWORD;
    if (username && password) {
      const token = Buffer.from(`${username}:${password}`).toString("base64");
      headers.Authorization = `Basic ${token}`;
    }
    return headers;
  }
}
