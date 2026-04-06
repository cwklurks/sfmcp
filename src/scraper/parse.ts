import type { Resource, RawSection, CategoryId } from "../types.js";
import { CATEGORIES } from "../types.js";
import type { SupabaseSection } from "./fetch.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateTags(label: string, categoryId: string): string[] {
  const words = label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const stopWords = new Set([
    "the", "and", "for", "with", "from", "your", "that", "this",
    "are", "was", "were", "been", "have", "has", "had", "not",
    "but", "all", "can", "her", "his", "how", "its", "may",
    "new", "now", "old", "see", "way", "who", "did", "get",
    "let", "say", "she", "too", "use", "one", "two",
  ]);

  const tags = words
    .filter((w) => !stopWords.has(w))
    .slice(0, 5);

  tags.push(categoryId);
  return [...new Set(tags)];
}

function mapSectionToCategory(sectionId: string): CategoryId | null {
  const categorySet = new Set<string>(CATEGORIES);
  if (categorySet.has(sectionId)) {
    return sectionId as CategoryId;
  }
  return null;
}

// --- New: Supabase-based parsing ---

export function supabaseSectionsToResources(
  sections: readonly SupabaseSection[]
): Resource[] {
  const resources: Resource[] = [];

  for (const section of sections) {
    const category = mapSectionToCategory(section.slug);
    if (!category) {
      continue;
    }

    const sortedItems = [...section.section_items].sort(
      (a, b) => a.display_order - b.display_order
    );

    for (const item of sortedItems) {
      const id = slugify(`${section.slug}-${item.label}`);
      resources.push({
        id,
        category,
        title: item.label,
        url: item.url,
        description: section.description,
        tags: generateTags(item.label, section.slug),
        metadata: {
          sectionTitle: section.title,
        },
      });
    }
  }

  return resources;
}

// --- Legacy bundle-based parsing (kept for backward compatibility) ---

export function extractSections(bundleText: string): RawSection[] {
  const sections: RawSection[] = [];

  const sectionPattern =
    /\{id:"([^"]+)",title:"([^"]*)",shortTitle:"([^"]*)",description:"([^"]*)",links:\[([^\]]*(?:\[[^\]]*\][^\]]*)*)\]\}/g;

  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(bundleText)) !== null) {
    const [, id, title, shortTitle, description, linksStr] = match;

    const links: { label: string; url: string }[] = [];
    const linkPattern = /\{label:"([^"]*)",url:"([^"]*)"\}/g;
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = linkPattern.exec(linksStr)) !== null) {
      links.push({ label: linkMatch[1], url: linkMatch[2] });
    }

    sections.push({
      id,
      title: unescapeJsString(title),
      shortTitle: unescapeJsString(shortTitle),
      description: unescapeJsString(description),
      links: links.map((l) => ({
        label: unescapeJsString(l.label),
        url: l.url,
      })),
    });
  }

  return sections;
}

function unescapeJsString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\")
    .replace(/\\u2019/g, "\u2019")
    .replace(/\\u2014/g, "\u2014")
    .replace(/\\u2013/g, "\u2013")
    .replace(/\\u201c/g, "\u201c")
    .replace(/\\u201d/g, "\u201d");
}

export function sectionsToResources(sections: readonly RawSection[]): Resource[] {
  const resources: Resource[] = [];

  for (const section of sections) {
    const category = mapSectionToCategory(section.id);
    if (!category) {
      continue;
    }

    for (const link of section.links) {
      const id = slugify(`${section.id}-${link.label}`);
      resources.push({
        id,
        category,
        title: link.label,
        url: link.url,
        description: section.description,
        tags: generateTags(link.label, section.id),
        metadata: {
          sectionTitle: section.title,
        },
      });
    }
  }

  return resources;
}

export function parseBundle(bundleText: string): Resource[] {
  const sections = extractSections(bundleText);
  return sectionsToResources(sections);
}
