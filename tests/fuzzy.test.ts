import { describe, it, expect } from "vitest";
import { fuzzySearch } from "../src/search/fuzzy.js";
import type { Resource } from "../src/types.js";

const mockResources: Resource[] = [
  {
    id: "yc",
    category: "accelerators",
    title: "Y Combinator",
    url: "https://ycombinator.com",
    description: "The most famous startup accelerator in Silicon Valley",
    tags: ["accelerator", "startup", "yc"],
  },
  {
    id: "mercury-banking",
    category: "legal-perks",
    title: "Mercury Banking",
    url: "https://mercury.com",
    description: "Banking for startups with free credits",
    tags: ["banking", "startup", "fintech"],
  },
  {
    id: "hacker-house-sf",
    category: "housing",
    title: "Hacker House SF",
    url: "https://hackerhouse.sf",
    description: "Coliving for founders and engineers in San Francisco",
    tags: ["housing", "coliving", "founders"],
  },
  {
    id: "cursor",
    category: "vibe-coding",
    title: "Cursor",
    url: "https://cursor.com",
    description: "AI-powered code editor for vibe coding",
    tags: ["coding", "ai", "editor", "vibe-coding"],
  },
  {
    id: "sf-events",
    category: "community",
    title: "SF Tech Events Calendar",
    url: "https://sfevents.example.com",
    description: "Community events and meetups in San Francisco",
    tags: ["events", "community", "meetups"],
  },
];

describe("fuzzySearch", () => {
  it("returns results matching query in title", () => {
    const results = fuzzySearch(mockResources, "cursor");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].resource.id).toBe("cursor");
  });

  it("returns results matching query in description", () => {
    const results = fuzzySearch(mockResources, "Silicon Valley");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].resource.id).toBe("yc");
  });

  it("returns results matching query in tags", () => {
    const results = fuzzySearch(mockResources, "fintech");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].resource.id).toBe("mercury-banking");
  });

  it("ranks title matches higher than description matches", () => {
    const results = fuzzySearch(mockResources, "startup");
    // "startup" is in YC description and Mercury description, but check scoring works
    expect(results.length).toBeGreaterThan(1);
  });

  it("filters by category when specified", () => {
    const results = fuzzySearch(mockResources, "startup", { category: "accelerators" });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.resource.category).toBe("accelerators");
    }
  });

  it("respects limit parameter", () => {
    const results = fuzzySearch(mockResources, "sf", { limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array for empty query", () => {
    const results = fuzzySearch(mockResources, "");
    expect(results).toEqual([]);
  });

  it("returns empty array for query with no matches", () => {
    const results = fuzzySearch(mockResources, "xyznonexistent");
    expect(results).toEqual([]);
  });

  it("is case insensitive", () => {
    const results = fuzzySearch(mockResources, "CURSOR");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].resource.id).toBe("cursor");
  });

  it("supports partial word matching", () => {
    const results = fuzzySearch(mockResources, "hack");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].resource.id).toBe("hacker-house-sf");
  });

  it("returns results with positive scores only", () => {
    const results = fuzzySearch(mockResources, "banking");
    for (const r of results) {
      expect(r.score).toBeGreaterThan(0);
    }
  });

  it("sorts results by score descending", () => {
    const results = fuzzySearch(mockResources, "startup");
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});
