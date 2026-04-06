import { load } from "cheerio";

const SITE_URL = "https://justmovetosf.com";
const USER_AGENT = "sfmcp/1.0 (MCP Server; resource indexer)";

const SUPABASE_URL = "https://kyvjujelxbczhookrsla.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dmp1amVseGJjemhvb2tyc2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzMzNzYsImV4cCI6MjA4Njg0OTM3Nn0.wullGO2VAVhGFuKtoKaC8KwVDDrOuTRtAmnAxd__Iec";

export interface SupabaseSection {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly short_title: string;
  readonly description: string;
  readonly display_order: number;
  readonly section_items: readonly SupabaseSectionItem[];
}

export interface SupabaseSectionItem {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly display_order: number;
  readonly section_id: string;
}

export async function fetchSections(): Promise<SupabaseSection[]> {
  const url = `${SUPABASE_URL}/rest/v1/sections?select=*,section_items(*)&order=display_order`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sections from Supabase: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<SupabaseSection[]>;
}

// --- Legacy bundle-based fetch (kept for fetch_live_content tool) ---

export async function fetchPageHtml(url: string = SITE_URL): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export function extractBundleUrl(html: string, baseUrl: string = SITE_URL): string {
  const $ = load(html);
  const scriptTag = $('script[type="module"][crossorigin]');

  if (scriptTag.length === 0) {
    throw new Error("Could not find module script tag in HTML");
  }

  const src = scriptTag.attr("src");
  if (!src) {
    throw new Error("Module script tag has no src attribute");
  }

  if (src.startsWith("http")) {
    return src;
  }

  return `${baseUrl}${src.startsWith("/") ? "" : "/"}${src}`;
}

export async function fetchBundle(bundleUrl: string): Promise<string> {
  const response = await fetch(bundleUrl, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bundle ${bundleUrl}: ${response.status}`);
  }

  return response.text();
}
