import { describe, it, expect, beforeAll } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadResources } from "../src/data/loader.js";
import { searchResources } from "../src/tools/search.js";
import { getRecommendations } from "../src/tools/recommendations.js";
import { estimateCosts } from "../src/tools/cost-calculator.js";
import { compare } from "../src/tools/compare.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../data/resources.json");

beforeAll(() => {
  loadResources(DATA_PATH);
});

describe("searchResources", () => {
  it("returns results for a matching query", () => {
    const result = searchResources({ query: "housing" });
    expect(result).toContain("Found");
    expect(result).not.toContain("No resources found");
  });

  it("returns no-match message for nonsense query", () => {
    const result = searchResources({ query: "xyznonexistent123" });
    expect(result).toContain("No resources found");
  });

  it("filters by category", () => {
    const result = searchResources({ query: "startup", category: "accelerators" });
    expect(result).toContain("accelerators");
  });

  it("respects limit", () => {
    const result = searchResources({ query: "san francisco", limit: 3 });
    const matches = result.match(/^\d+\./gm);
    expect((matches?.length ?? 0)).toBeLessThanOrEqual(3);
  });
});

describe("getRecommendations", () => {
  it("returns default recommendations when no criteria given", () => {
    const result = getRecommendations({});
    expect(result).toContain("Recommendations");
    expect(result).toContain("Essential Reads");
  });

  it("includes visa section for international founders", () => {
    const result = getRecommendations({ visa_status: "international" });
    expect(result).toContain("Visa");
  });

  it("includes housing for budget criteria", () => {
    const result = getRecommendations({ budget: 2000 });
    expect(result).toContain("Housing");
  });

  it("shows stage-relevant categories", () => {
    const result = getRecommendations({ stage: "fundraising" });
    expect(result).toContain("fundraising");
  });

  it("does not include visa section for US citizens", () => {
    const result = getRecommendations({ visa_status: "citizen" });
    expect(result).not.toContain("Visa & Immigration");
  });
});

describe("estimateCosts", () => {
  it("returns summary table when no params given", () => {
    const result = estimateCosts({});
    expect(result).toContain("Housing Cost Estimator");
    expect(result).toContain("Mission");
    expect(result).toContain("SOMA");
  });

  it("returns neighborhood detail for specific neighborhood", () => {
    const result = estimateCosts({ neighborhood: "Mission" });
    expect(result).toContain("Mission");
    expect(result).toContain("Room");
    expect(result).toContain("Studio");
  });

  it("returns type comparison for specific housing type", () => {
    const result = estimateCosts({ housing_type: "studio" });
    expect(result).toContain("Studio Prices");
    expect(result).toContain("Mission");
  });

  it("returns specific breakdown for both params", () => {
    const result = estimateCosts({ neighborhood: "SOMA", housing_type: "1br" });
    expect(result).toContain("1-Bedroom in SOMA");
    expect(result).toContain("Rent");
    expect(result).toContain("Total");
  });

  it("handles unknown neighborhood gracefully", () => {
    const result = estimateCosts({ neighborhood: "Atlantis" });
    expect(result).toContain("Unknown neighborhood");
  });

  it("handles unknown housing type gracefully", () => {
    const result = estimateCosts({ housing_type: "mansion" });
    expect(result).toContain("Unknown housing type");
  });

  it("normalizes housing type aliases", () => {
    const result = estimateCosts({ housing_type: "hackerhouse" });
    expect(result).toContain("Hacker House");
  });
});

describe("compare", () => {
  it("returns comparison table for valid items", () => {
    const result = compare({ items: ["Y Combinator", "Techstars"], type: "accelerators" });
    expect(result).toContain("Comparison");
    expect(result).toContain("|");
  });

  it("rejects fewer than 2 items", () => {
    const result = compare({ items: ["only-one"], type: "housing" });
    expect(result).toContain("at least 2");
  });

  it("rejects more than 5 items", () => {
    const result = compare({
      items: ["a", "b", "c", "d", "e", "f"],
      type: "housing",
    });
    expect(result).toContain("at most 5");
  });

  it("indicates unmatched items", () => {
    const result = compare({
      items: ["xyznonexistent", "Y Combinator"],
      type: "accelerators",
    });
    expect(result).toContain("not found");
  });
});
