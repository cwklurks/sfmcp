const SUPABASE_URL = "https://kyvjujelxbczhookrsla.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dmp1amVseGJjemhvb2tyc2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzMzNzYsImV4cCI6MjA4Njg0OTM3Nn0.wullGO2VAVhGFuKtoKaC8KwVDDrOuTRtAmnAxd__Iec";

interface Investor {
  readonly firm_name: string;
  readonly slug: string;
  readonly location: string;
  readonly activity: string;
  readonly check_size: string;
  readonly check_min_usd: number;
  readonly check_max_usd: number;
  readonly stages: readonly string[];
  readonly sectors: readonly string[];
  readonly thesis: string;
  readonly description: string;
  readonly portfolio_count: number;
  readonly website_url: string;
  readonly twitter_handle: string;
}

function formatInvestor(inv: Investor, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : "";
  return [
    `${prefix}**${inv.firm_name}**`,
    `   Check size: ${inv.check_size}`,
    `   Stages: ${inv.stages.join(", ")}`,
    `   Sectors: ${inv.sectors.join(", ")}`,
    `   Thesis: ${inv.thesis}`,
    `   Portfolio: ${inv.portfolio_count} companies`,
    `   Website: ${inv.website_url}`,
    inv.twitter_handle ? `   Twitter: ${inv.twitter_handle}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export interface SearchInvestorsInput {
  readonly query?: string;
  readonly stage?: string;
  readonly sector?: string;
  readonly max_check_size?: number;
  readonly min_check_size?: number;
  readonly limit?: number;
}

export async function searchInvestors(input: SearchInvestorsInput): Promise<string> {
  const params = new URLSearchParams();
  params.set(
    "select",
    "firm_name,slug,location,activity,check_size,check_min_usd,check_max_usd,stages,sectors,thesis,description,portfolio_count,website_url,twitter_handle"
  );
  params.set("activity", "eq.Active");
  params.set("order", "firm_name");

  if (input.min_check_size) {
    params.set("check_max_usd", `gte.${input.min_check_size}`);
  }
  if (input.max_check_size) {
    params.set("check_min_usd", `lte.${input.max_check_size}`);
  }

  const limit = input.limit ?? 20;
  // Fetch more than needed since we filter in-memory by stage/sector/query
  params.set("limit", "500");

  const response = await fetch(`${SUPABASE_URL}/rest/v1/investors?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch investors: ${response.status}`);
  }

  let investors = (await response.json()) as Investor[];

  if (input.stage) {
    const stage = input.stage.toLowerCase();
    investors = investors.filter((inv) =>
      inv.stages.some((s) => s.toLowerCase().includes(stage))
    );
  }

  if (input.sector) {
    const sector = input.sector.toLowerCase();
    investors = investors.filter((inv) =>
      inv.sectors.some((s) => s.toLowerCase().includes(sector))
    );
  }

  if (input.query) {
    const q = input.query.toLowerCase();
    investors = investors.filter(
      (inv) =>
        inv.firm_name.toLowerCase().includes(q) ||
        inv.thesis.toLowerCase().includes(q) ||
        inv.description.toLowerCase().includes(q) ||
        inv.sectors.some((s) => s.toLowerCase().includes(q))
    );
  }

  if (investors.length === 0) {
    return "No investors found matching your criteria. Try broadening your search.";
  }

  const lines = investors.slice(0, limit).map((inv, i) => formatInvestor(inv, i));
  return `Found ${investors.length} investors:\n\n${lines.join("\n\n")}`;
}

export interface GetInvestorInput {
  readonly slug: string;
}

export async function getInvestor(input: GetInvestorInput): Promise<string> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/investors?select=*&slug=eq.${encodeURIComponent(input.slug)}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch investor: ${response.status}`);
  }

  const investors = (await response.json()) as Investor[];

  if (investors.length === 0) {
    return `Investor "${input.slug}" not found. Use search_investors to find available investors.`;
  }

  const inv = investors[0];
  return [
    `# ${inv.firm_name}`,
    "",
    `**Check size:** ${inv.check_size}`,
    `**Stages:** ${inv.stages.join(", ")}`,
    `**Sectors:** ${inv.sectors.join(", ")}`,
    `**Location:** ${inv.location}`,
    `**Status:** ${inv.activity}`,
    `**Portfolio:** ${inv.portfolio_count} companies`,
    "",
    `## Thesis`,
    inv.thesis,
    "",
    `## Description`,
    inv.description,
    "",
    `**Website:** ${inv.website_url}`,
    inv.twitter_handle ? `**Twitter:** ${inv.twitter_handle}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
