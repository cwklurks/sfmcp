import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchSections } from "../scraper/fetch.js";
import { supabaseSectionsToResources } from "../scraper/parse.js";
import { reloadResources } from "../data/loader.js";
import type { Resource } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../../data/resources.json");

function buildCategoryBreakdown(
  resources: readonly Resource[]
): ReadonlyMap<string, number> {
  return resources.reduce((acc, r) => {
    const current = acc.get(r.category) ?? 0;
    return new Map([...acc, [r.category, current + 1]]);
  }, new Map<string, number>());
}

function formatBreakdown(categories: ReadonlyMap<string, number>): string {
  return [...categories.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cat, count]) => `  ${cat}: ${count}`)
    .join("\n");
}

export async function refreshData(): Promise<string> {
  const sections = await fetchSections();
  const resources = supabaseSectionsToResources(sections);

  if (resources.length === 0) {
    return "Refresh failed: no resources extracted. The API response may have changed.";
  }

  writeFileSync(DATA_PATH, JSON.stringify(resources, null, 2));
  reloadResources(DATA_PATH);

  const categories = buildCategoryBreakdown(resources);
  const breakdown = formatBreakdown(categories);

  return `Data refreshed successfully!\n\nTotal resources: ${resources.length}\n\nBy category:\n${breakdown}`;
}
