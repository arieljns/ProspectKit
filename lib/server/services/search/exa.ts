import "server-only";

import { z } from "zod";
import { env } from "@/lib/env.mjs";

const EXA_API_BASE_URL = "https://api.exa.ai";

const exaResultSchema = z.object({
  title: z.string().optional(),
  url: z.string().url(),
  id: z.string().optional(),
  publishedDate: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  text: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  summary: z.string().optional(),
});

const exaResponseSchema = z.object({
  results: z.array(exaResultSchema),
});

type ExaSearchType = "auto" | "fast" | "instant" | "deep" | "deep-reasoning";
type ExaSearchCategory =
  | "company"
  | "people"
  | "research paper"
  | "news"
  | "personal site"
  | "financial report";

type ExaHighlightsOptions =
  | boolean
  | {
      maxCharacters?: number;
      query?: string;
    };

type ExaTextOptions =
  | boolean
  | {
      maxCharacters?: number;
      verbosity?: "compact" | "standard" | "full";
    };

type ExaSummaryOptions =
  | boolean
  | {
      query?: string;
      schema?: Record<string, unknown>;
    };

type ExaContentOptions = {
  text?: ExaTextOptions;
  highlights?: ExaHighlightsOptions;
  summary?: ExaSummaryOptions;
  maxAgeHours?: number;
  livecrawlTimeout?: number;
};

export type ExaResult = z.infer<typeof exaResultSchema>;

export type ExaSearchOptions = {
  query: string;
  type?: ExaSearchType;
  category?: ExaSearchCategory;
  numResults?: number;
  userLocation?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  contents?: ExaContentOptions;
};

export type ExaContentsOptions = {
  urls: string[];
  text?: ExaTextOptions;
  highlights?: ExaHighlightsOptions;
  summary?: ExaSummaryOptions;
  maxAgeHours?: number;
  livecrawlTimeout?: number;
};

function getExaApiKey() {
  const apiKey = env.EXA_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("EXA_API_KEY is not configured");
  }

  return apiKey;
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );
}

async function exaRequest<T>(
  path: string,
  body: Record<string, unknown>,
  schema: z.ZodSchema<T>,
) {
  const response = await fetch(`${EXA_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getExaApiKey(),
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const rawBody = await response.text();
  const parsedBody = rawBody ? safeJsonParse(rawBody) : null;

  if (!response.ok) {
    const errorMessage =
      parsedBody &&
      typeof parsedBody === "object" &&
      "error" in parsedBody &&
      typeof parsedBody.error === "string"
        ? parsedBody.error
        : `Exa request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  return schema.parse(parsedBody);
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function searchExa(options: ExaSearchOptions) {
  const payload = compactObject({
    query: options.query,
    type: options.type,
    category: options.category,
    numResults: options.numResults,
    userLocation: options.userLocation,
    includeDomains: options.includeDomains?.length
      ? options.includeDomains
      : undefined,
    excludeDomains: options.excludeDomains?.length
      ? options.excludeDomains
      : undefined,
    startPublishedDate: options.startPublishedDate,
    endPublishedDate: options.endPublishedDate,
    contents: options.contents
      ? compactObject({
          text: options.contents.text,
          highlights: options.contents.highlights,
          summary: options.contents.summary,
          maxAgeHours: options.contents.maxAgeHours,
          livecrawlTimeout: options.contents.livecrawlTimeout,
        })
      : undefined,
  });

  const response = await exaRequest("/search", payload, exaResponseSchema);
  return response.results;
}

export async function getExaContents(options: ExaContentsOptions) {
  const payload = compactObject({
    urls: options.urls,
    text: options.text,
    highlights: options.highlights,
    summary: options.summary,
    maxAgeHours: options.maxAgeHours,
    livecrawlTimeout: options.livecrawlTimeout,
  });

  const response = await exaRequest("/contents", payload, exaResponseSchema);
  return response.results;
}

function trimBlock(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

export function formatExaResultsForPrompt(
  results: ExaResult[],
  heading = "Exa search results",
) {
  if (results.length === 0) {
    return `${heading}: no results found.`;
  }

  const blocks = results.map((result, index) => {
    const lines = [
      `Result ${index + 1}: ${result.title?.trim() || "Untitled result"}`,
      `URL: ${result.url}`,
    ];

    if (result.publishedDate) {
      lines.push(`Published: ${result.publishedDate}`);
    }

    if (result.author) {
      lines.push(`Author: ${result.author}`);
    }

    if (result.summary) {
      lines.push(`Summary: ${trimBlock(result.summary, 1000)}`);
    }

    if (result.highlights?.length) {
      lines.push(
        "Highlights:",
        ...result.highlights
          .slice(0, 4)
          .map((highlight) => `- ${trimBlock(highlight, 700)}`),
      );
    } else if (result.text) {
      lines.push(`Text: ${trimBlock(result.text, 1400)}`);
    }

    return lines.join("\n");
  });

  return `${heading}:\n\n${blocks.join("\n\n")}`;
}

export function extractDomain(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
