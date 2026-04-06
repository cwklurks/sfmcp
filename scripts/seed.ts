import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchSections } from "../src/scraper/fetch.js";
import { supabaseSectionsToResources } from "../src/scraper/parse.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");
const OUTPUT_PATH = resolve(DATA_DIR, "resources.json");

async function seed(): Promise<void> {
  process.stderr.write("Fetching sections from Supabase...\n");
  const sections = await fetchSections();
  process.stderr.write(`Fetched ${sections.length} sections\n`);

  process.stderr.write("Converting to resources...\n");
  const resources = supabaseSectionsToResources(sections);
  process.stderr.write(`Found ${resources.length} resources across ${sections.length} sections\n`);

  if (resources.length === 0) {
    throw new Error("No resources extracted — API response may have changed");
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(resources, null, 2));
  process.stderr.write(`Wrote ${resources.length} resources to ${OUTPUT_PATH}\n`);

  const categories = new Map<string, number>();
  for (const r of resources) {
    categories.set(r.category, (categories.get(r.category) ?? 0) + 1);
  }

  process.stderr.write("\nCategory breakdown:\n");
  for (const [cat, count] of [...categories.entries()].sort()) {
    process.stderr.write(`  ${cat}: ${count}\n`);
  }
}

seed().catch((error: unknown) => {
  process.stderr.write(`Seed failed: ${error}\n`);
  process.exit(1);
});
