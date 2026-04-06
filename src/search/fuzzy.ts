import type { Resource, CategoryId } from "../types.js";

export interface SearchResult {
  readonly resource: Resource;
  readonly score: number;
}

interface SearchOptions {
  readonly category?: CategoryId;
  readonly limit?: number;
}

const TITLE_WEIGHT = 3;
const DESCRIPTION_WEIGHT = 2;
const TAG_WEIGHT = 1;

function tokenize(text: string): readonly string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function scoreField(fieldTokens: readonly string[], queryTokens: readonly string[]): number {
  let score = 0;

  for (const qt of queryTokens) {
    for (const ft of fieldTokens) {
      if (ft === qt) {
        score += 1.0;
      } else if (ft.startsWith(qt)) {
        score += 0.7;
      } else if (ft.includes(qt)) {
        score += 0.4;
      }
    }
  }

  return score;
}

function scoreResource(resource: Resource, queryTokens: readonly string[]): number {
  const titleTokens = tokenize(resource.title);
  const descTokens = tokenize(resource.description);
  const tagTokens = resource.tags.flatMap((t) => tokenize(t));

  const titleScore = scoreField(titleTokens, queryTokens) * TITLE_WEIGHT;
  const descScore = scoreField(descTokens, queryTokens) * DESCRIPTION_WEIGHT;
  const tagScore = scoreField(tagTokens, queryTokens) * TAG_WEIGHT;

  return titleScore + descScore + tagScore;
}

export function fuzzySearch(
  resources: readonly Resource[],
  query: string,
  options: SearchOptions = {}
): readonly SearchResult[] {
  const { category, limit = 10 } = options;
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  const filtered = category
    ? resources.filter((r) => r.category === category)
    : resources;

  const scored: SearchResult[] = filtered
    .map((resource) => ({
      resource,
      score: scoreResource(resource, queryTokens),
    }))
    .filter((result) => result.score > 0);

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
