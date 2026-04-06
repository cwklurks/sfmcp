import { z } from "zod";

export const CATEGORIES = [
  "housing",
  "accelerators",
  "fundraising",
  "community",
  "vibe-coding",
  "startup-jobs",
  "essential-reads",
  "legal-perks",
  "people-to-follow",
  "daily-life",
  "visa",
  "voices-media",
] as const;

export const CategoryId = z.enum(CATEGORIES);
export type CategoryId = z.infer<typeof CategoryId>;

export const ResourceSchema = z.object({
  id: z.string(),
  category: CategoryId,
  title: z.string(),
  url: z.string().url(),
  description: z.string(),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type Resource = z.infer<typeof ResourceSchema>;

export const CategorySchema = z.object({
  id: CategoryId,
  name: z.string(),
  description: z.string(),
  resourceCount: z.number(),
});

export type Category = z.infer<typeof CategorySchema>;

export const HousingType = z.enum(["room", "studio", "1br", "hacker-house"]);
export type HousingType = z.infer<typeof HousingType>;

export const CostEstimateSchema = z.object({
  neighborhood: z.string(),
  housingType: HousingType,
  monthlyRent: z.object({ low: z.number(), high: z.number() }),
  utilities: z.number(),
  food: z.number(),
  transport: z.number(),
  total: z.object({ low: z.number(), high: z.number() }),
});

export type CostEstimate = z.infer<typeof CostEstimateSchema>;

export interface RawSection {
  readonly id: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly links: readonly { readonly label: string; readonly url: string }[];
}

export const CATEGORY_INFO: Record<CategoryId, { name: string; description: string }> = {
  housing: {
    name: "Housing & Neighborhoods",
    description:
      "Hacker houses are the move for early founders. Budget $1,500–$2,500/mo for a room. Where you live shapes your network.",
  },
  accelerators: {
    name: "Accelerators & Programs",
    description:
      "Apply to these. They give you money, mentors, and a reason to ship faster.",
  },
  fundraising: {
    name: "Fundraising & First Checks",
    description:
      "Angels in SF move fast. Decisions in days, not weeks. Here's where to find them.",
  },
  community: {
    name: "Community, Events & AI Scene",
    description:
      "SF is a small town disguised as a city. Everyone's at the same 5 events. Show up.",
  },
  "vibe-coding": {
    name: "Vibe Coding: Build Without Code",
    description:
      "You don't need to be an engineer anymore. These tools let you build real products with AI.",
  },
  "startup-jobs": {
    name: "Jobs, Fellowships & Talent",
    description:
      "Most startup jobs never touch LinkedIn. Here's where they actually live.",
  },
  "essential-reads": {
    name: "Essential Reads & Guides",
    description:
      "The best essays, threads, and guides about building in SF. Read these before you arrive.",
  },
  "legal-perks": {
    name: "Legal, Perks & Credits",
    description:
      "Delaware C-Corp. Standard docs. Free credits. Extend your runway before you even start.",
  },
  "people-to-follow": {
    name: "People to Follow on X/Twitter",
    description:
      "The people shaping SF's startup scene. Follow them, learn from them, eventually meet them.",
  },
  "daily-life": {
    name: "Daily Life: Food, Fitness, Cafes & Getting Around",
    description:
      "SF is 7x7 miles. Your office is wherever your laptop is. Here's how to live well.",
  },
  visa: {
    name: "Visa & Immigration for International Founders",
    description:
      "Harder but very doable. Many resources exist specifically for international founders.",
  },
  "voices-media": {
    name: "Reddit, YouTube & Podcasts",
    description:
      "Real talk from real people who moved. Hear their stories and get unfiltered advice.",
  },
};
