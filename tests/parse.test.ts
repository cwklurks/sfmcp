import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extractSections, sectionsToResources, parseBundle } from "../src/scraper/parse.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(__dirname, "fixtures/sample-bundle.js");
const fixtureBundle = readFileSync(fixturePath, "utf-8");

describe("extractSections", () => {
  it("extracts all sections from bundle text", () => {
    const sections = extractSections(fixtureBundle);
    expect(sections.length).toBeGreaterThanOrEqual(3);
  });

  it("extracts section id, title, shortTitle, and description", () => {
    const sections = extractSections(fixtureBundle);
    const housing = sections.find((s) => s.id === "housing");
    expect(housing).toBeDefined();
    expect(housing!.title).toBeTruthy();
    expect(housing!.shortTitle).toBeTruthy();
    expect(housing!.description).toBeTruthy();
  });

  it("extracts links with label and url", () => {
    const sections = extractSections(fixtureBundle);
    const housing = sections.find((s) => s.id === "housing");
    expect(housing!.links.length).toBeGreaterThanOrEqual(2);
    expect(housing!.links[0].label).toBeTruthy();
    expect(housing!.links[0].url).toMatch(/^https?:\/\//);
  });

  it("returns empty array for text with no sections", () => {
    const sections = extractSections("just some random javascript code");
    expect(sections).toEqual([]);
  });
});

describe("sectionsToResources", () => {
  it("converts sections to Resource objects", () => {
    const sections = extractSections(fixtureBundle);
    const resources = sectionsToResources(sections);
    expect(resources.length).toBeGreaterThan(0);
  });

  it("assigns correct category from section id", () => {
    const sections = extractSections(fixtureBundle);
    const resources = sectionsToResources(sections);
    const housingResources = resources.filter((r) => r.category === "housing");
    expect(housingResources.length).toBeGreaterThanOrEqual(2);
  });

  it("generates slugified id from section and label", () => {
    const sections = extractSections(fixtureBundle);
    const resources = sectionsToResources(sections);
    for (const r of resources) {
      expect(r.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("generates tags from label text", () => {
    const sections = extractSections(fixtureBundle);
    const resources = sectionsToResources(sections);
    for (const r of resources) {
      expect(r.tags.length).toBeGreaterThan(0);
      expect(r.tags).toContain(r.category);
    }
  });

  it("skips sections with unknown category ids", () => {
    const sections = [
      { id: "unknown-category", title: "Unknown", shortTitle: "Unk", description: "Test", links: [{ label: "Test", url: "https://example.com" }] },
    ];
    const resources = sectionsToResources(sections);
    expect(resources).toEqual([]);
  });
});

describe("parseBundle", () => {
  it("is the composition of extractSections + sectionsToResources", () => {
    const resources = parseBundle(fixtureBundle);
    expect(resources.length).toBeGreaterThan(0);
    expect(resources[0].id).toBeTruthy();
    expect(resources[0].category).toBeTruthy();
    expect(resources[0].url).toMatch(/^https?:\/\//);
  });
});
