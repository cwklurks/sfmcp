import { getByCategory } from "../data/loader.js";
import type { Resource, CategoryId } from "../types.js";

export interface RecommendationInput {
  readonly budget?: number;
  readonly visa_status?: string;
  readonly stage?: string;
}

const STAGE_CATEGORIES: Readonly<Record<string, readonly CategoryId[]>> = {
  idea: ["accelerators", "community", "vibe-coding", "essential-reads"],
  "pre-launch": ["accelerators", "vibe-coding", "community", "startup-jobs"],
  fundraising: [
    "fundraising",
    "accelerators",
    "legal-perks",
    "people-to-follow",
  ],
  scaling: ["startup-jobs", "fundraising", "legal-perks", "community"],
};

const DEFAULT_CATEGORIES: readonly CategoryId[] = [
  "accelerators",
  "community",
  "fundraising",
];

interface RecommendationSection {
  readonly section: string;
  readonly resources: readonly Resource[];
}

function buildStageRecommendations(
  stage: string
): readonly RecommendationSection[] {
  const normalizedStage = stage.toLowerCase();
  const categories =
    STAGE_CATEGORIES[normalizedStage] ?? DEFAULT_CATEGORIES;

  return categories.reduce<readonly RecommendationSection[]>((acc, cat) => {
    const resources = getByCategory(cat);
    return resources.length > 0
      ? [...acc, { section: `${cat} (for ${normalizedStage} stage)`, resources: resources.slice(0, 5) }]
      : acc;
  }, []);
}

function buildBudgetRecommendations(
  budget: number
): readonly RecommendationSection[] {
  const housing = getByCategory("housing");
  return [
    { section: `Housing (budget: $${budget}/mo)`, resources: housing.slice(0, 5) },
  ];
}

function buildVisaRecommendations(): readonly RecommendationSection[] {
  const visa = getByCategory("visa");
  const legal = getByCategory("legal-perks");
  return [
    { section: "Visa & Immigration", resources: visa.slice(0, 5) },
    { section: "Legal Help", resources: legal.slice(0, 3) },
  ];
}

function buildDefaultRecommendations(): readonly RecommendationSection[] {
  const essential = getByCategory("essential-reads");
  const community = getByCategory("community");
  const housing = getByCategory("housing");
  return [
    { section: "Start Here: Essential Reads", resources: essential.slice(0, 5) },
    { section: "Community & Events", resources: community.slice(0, 5) },
    { section: "Housing", resources: housing.slice(0, 5) },
  ];
}

function isInternational(visaStatus: string): boolean {
  const normalized = visaStatus.toLowerCase();
  return normalized !== "citizen" && normalized !== "us";
}

function formatSection(rec: RecommendationSection): string {
  const items = rec.resources
    .map((r) => `  - **${r.title}**: ${r.url}`)
    .join("\n");
  return `### ${rec.section}\n${items}`;
}

export function getRecommendations(input: RecommendationInput): string {
  const sections: RecommendationSection[] = [];

  if (input.stage) {
    sections.push(...buildStageRecommendations(input.stage));
  }

  if (input.budget !== undefined) {
    sections.push(...buildBudgetRecommendations(input.budget));
  }

  if (input.visa_status && isInternational(input.visa_status)) {
    sections.push(...buildVisaRecommendations());
  }

  const finalSections =
    sections.length > 0 ? sections : buildDefaultRecommendations();

  const formatted = finalSections.map(formatSection);

  return `# Recommendations for You\n\n${formatted.join("\n\n")}`;
}
