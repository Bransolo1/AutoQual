import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SearchInsightsInput } from "./search.dto";

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

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

    const url = process.env.OPENSEARCH_URL;
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

  async searchInsights(input: SearchInsightsInput) {
    const query = input.query?.trim();
    if (!query) {
      return { results: [], reason: "query_required" };
    }
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
    const url = process.env.OPENSEARCH_URL;
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
      return {
        indexed: true,
        results: hits.map((hit: { _source?: Record<string, unknown> }) => hit._source ?? {}),
      };
    } catch (error) {
      return { results: [], indexed: false, reason: "search_failed", error: String(error) };
    }
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
    return {
      ...base,
      evidence: insights.map((insight) => ({
        id: insight.id,
        statement: insight.statement,
        transcriptSpans: insight.supportingTranscriptSpans,
        videoClips: insight.supportingVideoClips,
      })),
    };
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
