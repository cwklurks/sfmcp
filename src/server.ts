import { z } from "zod";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadResources, getByCategory, getCategories } from "./data/loader.js";
import { CategoryId, CATEGORY_INFO, CATEGORIES } from "./types.js";
import { searchResources } from "./tools/search.js";
import { getRecommendations } from "./tools/recommendations.js";
import { fetchLiveContent } from "./tools/live-fetch.js";
import { refreshData } from "./tools/refresh.js";
import { estimateCosts } from "./tools/cost-calculator.js";
import { compare } from "./tools/compare.js";
import { listGuides, readGuide } from "./tools/guides.js";
import { searchInvestors, getInvestor } from "./tools/investors.js";
import { browseCategory } from "./tools/browse-category.js";

function registerResources(server: McpServer): void {
  // Index resource — lists all categories
  server.resource(
    "sf-index",
    "sf://index",
    { description: "Master index of all SF resource categories with counts" },
    async (uri) => {
      const categories = getCategories();
      const text = JSON.stringify(categories, null, 2);
      return { contents: [{ uri: uri.href, text }] };
    }
  );

  // Dynamic category resources — sf://housing, sf://accelerators, etc.
  server.resource(
    "sf-category",
    new ResourceTemplate("sf://{category}", {
      list: async () => ({
        resources: CATEGORIES.map((cat) => ({
          uri: `sf://${cat}`,
          name: CATEGORY_INFO[cat].name,
          description: CATEGORY_INFO[cat].description,
        })),
      }),
    }),
    { description: "SF resources filtered by category" },
    async (uri, { category }) => {
      const categoryId = CategoryId.safeParse(category);
      if (!categoryId.success) {
        return {
          contents: [
            {
              uri: uri.href,
              text: `Unknown category: ${category}. Valid: ${CATEGORIES.join(", ")}`,
            },
          ],
        };
      }

      const resources = getByCategory(categoryId.data);
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(resources, null, 2) }],
      };
    }
  );
}

function registerTools(server: McpServer): void {
  server.tool(
    "search_resources",
    "Search SF relocation resources by keyword. Returns ranked results with relevance scores.",
    {
      query: z.string().describe("Search query (e.g. 'hacker house', 'visa lawyer', 'Y Combinator')"),
      category: CategoryId.optional().describe("Filter to a specific category"),
      limit: z.number().min(1).max(50).optional().describe("Max results to return (default: 10)"),
    },
    async ({ query, category, limit }) => ({
      content: [{ type: "text" as const, text: searchResources({ query, category, limit }) }],
    })
  );

  server.tool(
    "get_recommendations",
    "Get personalized SF resource recommendations based on your situation.",
    {
      budget: z.number().optional().describe("Monthly budget in USD"),
      visa_status: z.string().optional().describe("Visa status (e.g. 'international', 'citizen', 'H1B')"),
      stage: z.string().optional().describe("Startup stage: idea, pre-launch, fundraising, or scaling"),
    },
    async ({ budget, visa_status, stage }) => ({
      content: [{ type: "text" as const, text: getRecommendations({ budget, visa_status, stage }) }],
    })
  );

  server.tool(
    "fetch_live_content",
    "Fetch and extract content from any URL. Returns cleaned text and links.",
    {
      url: z.string().url().describe("URL to fetch and extract content from"),
    },
    async ({ url }) => ({
      content: [{ type: "text" as const, text: await fetchLiveContent({ url }) }],
    })
  );

  server.tool(
    "refresh_data",
    "Re-scrape justmovetosf.com and update the local resource database.",
    {},
    async () => ({
      content: [{ type: "text" as const, text: await refreshData() }],
    })
  );

  server.tool(
    "estimate_costs",
    "Estimate monthly living costs in SF by neighborhood and housing type.",
    {
      neighborhood: z.string().optional().describe("SF neighborhood (Mission, SOMA, Hayes Valley, Dogpatch, Richmond, Sunset)"),
      housing_type: z.string().optional().describe("Housing type: room, studio, 1br, or hacker-house"),
    },
    async ({ neighborhood, housing_type }) => ({
      content: [{ type: "text" as const, text: estimateCosts({ neighborhood, housing_type }) }],
    })
  );

  server.tool(
    "compare",
    "Side-by-side comparison of SF resources (neighborhoods, accelerators, or housing options).",
    {
      items: z.array(z.string()).min(2).max(5).describe("Items to compare (2-5 names)"),
      type: z.enum(["neighborhoods", "accelerators", "housing"]).describe("Type of comparison"),
    },
    async ({ items, type }) => ({
      content: [{ type: "text" as const, text: compare({ items, type }) }],
    })
  );

  server.tool(
    "list_guides",
    "List all available SF relocation guides. Returns titles, slugs, and descriptions.",
    {},
    async () => ({
      content: [{ type: "text" as const, text: await listGuides() }],
    })
  );

  server.tool(
    "read_guide",
    "Read a full SF relocation guide by slug. Guides cover housing, fundraising, networking, visas, vibe coding, and more.",
    {
      slug: z.string().describe("Guide slug (e.g. 'housing', 'fundraising', 'first-30-days', 'o1-visa-cheat-sheet')"),
    },
    async ({ slug }) => ({
      content: [{ type: "text" as const, text: await readGuide({ slug }) }],
    })
  );

  server.tool(
    "search_investors",
    "Search SF investors by stage, sector, check size, or keyword. Returns matching investor firms with details.",
    {
      query: z.string().optional().describe("Search keyword (e.g. 'AI', 'consumer', 'fintech')"),
      stage: z.string().optional().describe("Investment stage filter (e.g. 'Pre-Seed', 'Seed', 'Series A')"),
      sector: z.string().optional().describe("Sector filter (e.g. 'AI/ML', 'B2B', 'Consumer', 'Fintech')"),
      min_check_size: z.number().optional().describe("Minimum check size in USD (e.g. 100000)"),
      max_check_size: z.number().optional().describe("Maximum check size in USD (e.g. 500000)"),
      limit: z.number().min(1).max(50).optional().describe("Max results (default: 20)"),
    },
    async ({ query, stage, sector, min_check_size, max_check_size, limit }) => ({
      content: [
        {
          type: "text" as const,
          text: await searchInvestors({ query, stage, sector, min_check_size, max_check_size, limit }),
        },
      ],
    })
  );

  server.tool(
    "get_investor",
    "Get detailed info about a specific SF investor firm by slug.",
    {
      slug: z.string().describe("Investor slug (e.g. 'founders-inc', 'precursor-ventures', 'hustle-fund')"),
    },
    async ({ slug }) => ({
      content: [{ type: "text" as const, text: await getInvestor({ slug }) }],
    })
  );

  server.tool(
    "browse_category",
    "List all resources in a specific category. Unlike search, this returns every resource in the category.",
    {
      category: CategoryId.describe("Category to browse"),
    },
    async ({ category }) => ({
      content: [{ type: "text" as const, text: browseCategory({ category }) }],
    })
  );
}

function registerPrompts(server: McpServer): void {
  server.prompt(
    "new-to-sf",
    "Comprehensive relocation guide for founders moving to SF",
    {
      budget: z.string().optional().describe("Monthly budget (e.g. '$3000')"),
      timeline: z.string().optional().describe("When you're moving (e.g. 'next month', '3 months')"),
    },
    ({ budget, timeline }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "I'm a founder moving to San Francisco.",
              budget ? `My monthly budget is ${budget}.` : "",
              timeline ? `I'm planning to move ${timeline}.` : "",
              "",
              "Please create a comprehensive relocation guide covering:",
              "1. **Housing**: Best neighborhoods and housing options for my budget",
              "2. **Community**: How to meet other founders and get plugged in",
              "3. **Startup infrastructure**: Accelerators, legal setup, banking",
              "4. **Daily life**: Food, transport, cafes, coworking",
              "5. **Timeline**: What to do before, during, and after the move",
              "",
              "Use the search_resources and estimate_costs tools to provide specific, actionable recommendations.",
              "Use get_recommendations to tailor advice to my situation.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    })
  );

  server.prompt(
    "startup-checklist",
    "Step-by-step startup launch checklist for SF",
    {
      stage: z.string().optional().describe("Current stage: idea, pre-launch, fundraising, scaling"),
      visa_needed: z.string().optional().describe("Whether visa/immigration help is needed (yes/no)"),
    },
    ({ stage, visa_needed }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "I need a startup launch checklist for San Francisco.",
              stage ? `I'm at the ${stage} stage.` : "",
              visa_needed === "yes"
                ? "I'm an international founder and need visa/immigration guidance."
                : "",
              "",
              "Create a step-by-step checklist covering:",
              "1. **Legal**: Delaware C-Corp, SAFE docs, bank account",
              "2. **Fundraising**: Where to find angels, how to pitch in SF",
              "3. **Accelerators**: Which to apply to and when",
              "4. **Community**: Events, meetups, people to follow",
              "5. **Tools**: Vibe coding tools, productivity stack",
              visa_needed === "yes"
                ? "6. **Visa**: Immigration options for founders"
                : "",
              "",
              "Use search_resources and get_recommendations tools to find specific resources for each step.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    })
  );

  server.prompt(
    "find-housing",
    "Housing search strategy for SF",
    {
      budget: z.string().describe("Monthly housing budget (e.g. '$2000')"),
      preferences: z.string().optional().describe("Preferences like 'close to downtown', 'quiet', 'hacker house'"),
    },
    ({ budget, preferences }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              `I'm looking for housing in San Francisco with a budget of ${budget}/month.`,
              preferences ? `My preferences: ${preferences}` : "",
              "",
              "Help me find housing by:",
              "1. Using estimate_costs to show what I can afford in each neighborhood",
              "2. Using search_resources to find specific housing resources",
              "3. Recommending the best neighborhoods for my budget and preferences",
              "4. Suggesting a search strategy (hacker houses, Craigslist, Facebook groups, etc.)",
              "",
              "Be specific about which neighborhoods work for my budget and what tradeoffs to expect.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    })
  );
}

export function createServer(): McpServer {
  // Load data on startup
  loadResources();

  const server = new McpServer({
    name: "sfmcp",
    version: "1.0.0",
  });

  registerResources(server);
  registerTools(server);
  registerPrompts(server);

  return server;
}
