import { getAll } from "../data/loader.js";
import { fuzzySearch } from "../search/fuzzy.js";
import type { CategoryId } from "../types.js";

export interface SearchInput {
  readonly query: string;
  readonly category?: CategoryId;
  readonly limit?: number;
}

export function searchResources(input: SearchInput): string {
  const resources = getAll();
  const results = fuzzySearch(resources, input.query, {
    category: input.category,
    limit: input.limit ?? 10,
  });

  if (results.length === 0) {
    return `No resources found matching "${input.query}"${input.category ? ` in category "${input.category}"` : ""}.`;
  }

  const lines = results.map(
    (r, i) =>
      `${i + 1}. **${r.resource.title}** (score: ${r.score.toFixed(1)})\n   ${r.resource.url}\n   Category: ${r.resource.category}\n   ${r.resource.description}`
  );

  return `Found ${results.length} resources matching "${input.query}":\n\n${lines.join("\n\n")}`;
}
