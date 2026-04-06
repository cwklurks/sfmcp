import { getAll, getByCategory } from "../data/loader.js";
import { fuzzySearch } from "../search/fuzzy.js";
import type { Resource, CategoryId } from "../types.js";

export interface CompareInput {
  readonly items: readonly string[];
  readonly type: "neighborhoods" | "accelerators" | "housing";
}

interface MatchedItem {
  readonly query: string;
  readonly resource: Resource | undefined;
}

const COMPARE_TYPE_CATEGORIES: Readonly<
  Record<CompareInput["type"], CategoryId>
> = {
  neighborhoods: "housing",
  accelerators: "accelerators",
  housing: "housing",
};

function matchItems(
  items: readonly string[],
  category: CategoryId
): readonly MatchedItem[] {
  const resources = getAll();

  return items.map((query) => {
    const results = fuzzySearch(resources, query, { category, limit: 1 });
    return {
      query,
      resource: results.length > 0 ? results[0].resource : undefined,
    };
  });
}

function buildComparisonRow(
  field: string,
  extractor: (r: Resource) => string,
  matched: readonly MatchedItem[]
): string {
  const values = matched.map((m) =>
    m.resource ? extractor(m.resource) : "N/A"
  );
  return `| ${field} | ${values.join(" | ")} |`;
}

function formatComparison(matched: readonly MatchedItem[]): string {
  const headers = matched.map((m) =>
    m.resource ? `**${m.resource.title}**` : `~~${m.query}~~ (not found)`
  );

  const headerRow = `| | ${headers.join(" | ")} |`;
  const separator = `|---|${matched.map(() => "---").join("|")}|`;

  const rows = [
    buildComparisonRow("Category", (r) => r.category, matched),
    buildComparisonRow("Description", (r) => truncate(r.description, 80), matched),
    buildComparisonRow("URL", (r) => r.url, matched),
    buildComparisonRow("Tags", (r) => r.tags.join(", "), matched),
  ];

  const notFound = matched.filter((m) => !m.resource);
  const warnings =
    notFound.length > 0
      ? `\n\n*Could not find matches for: ${notFound.map((m) => `"${m.query}"`).join(", ")}*`
      : "";

  return [
    `# Comparison`,
    "",
    headerRow,
    separator,
    ...rows,
    warnings,
  ].join("\n");
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength
    ? `${text.slice(0, maxLength - 3)}...`
    : text;
}

export function compare(input: CompareInput): string {
  if (input.items.length < 2) {
    return "Please provide at least 2 items to compare.";
  }

  if (input.items.length > 5) {
    return "Please provide at most 5 items to compare for readability.";
  }

  const category = COMPARE_TYPE_CATEGORIES[input.type];
  const matched = matchItems(input.items, category);

  return formatComparison(matched);
}
