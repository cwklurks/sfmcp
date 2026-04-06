import { getByCategory, getCategories } from "../data/loader.js";
import type { CategoryId } from "../types.js";
import { CATEGORY_INFO } from "../types.js";

export interface BrowseCategoryInput {
  readonly category: CategoryId;
}

export function browseCategory(input: BrowseCategoryInput): string {
  const resources = getByCategory(input.category);
  const info = CATEGORY_INFO[input.category];

  if (resources.length === 0) {
    const categories = getCategories();
    const available = categories.map((c) => `${c.id} (${c.resourceCount})`).join(", ");
    return `No resources in category "${input.category}". Available: ${available}`;
  }

  const lines = resources.map(
    (r, i) =>
      `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.description}`
  );

  return [
    `## ${info.name}`,
    "",
    info.description,
    "",
    `${resources.length} resources:`,
    "",
    lines.join("\n\n"),
  ].join("\n");
}
