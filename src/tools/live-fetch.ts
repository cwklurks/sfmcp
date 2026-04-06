import { load } from "cheerio";

export interface LiveFetchInput {
  readonly url: string;
}

const USER_AGENT = "sfmcp/1.0 (MCP Server; live content fetch)";
const MAX_BODY_LENGTH = 5000;
const MAX_LINKS = 20;

function extractLinks($: ReturnType<typeof load>): readonly string[] {
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (href && text && href.startsWith("http")) {
      links.push(`- [${text}](${href})`);
    }
  });
  return links.slice(0, MAX_LINKS);
}

function cleanBody($: ReturnType<typeof load>): string {
  $("script, style, nav, footer, header, iframe, noscript").remove();
  return $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_BODY_LENGTH);
}

function formatResult(
  title: string,
  url: string,
  body: string,
  links: readonly string[]
): string {
  const parts = [`# ${title || url}`, "", body];
  if (links.length > 0) {
    parts.push("", "## Links Found", ...links);
  }
  return parts.join("\n");
}

export async function fetchLiveContent(
  input: LiveFetchInput
): Promise<string> {
  const response = await fetch(input.url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    return `Failed to fetch ${input.url}: ${response.status} ${response.statusText}`;
  }

  const html = await response.text();
  const $ = load(html);

  const title = $("title").text().trim();
  const links = extractLinks($);
  const body = cleanBody($);

  return formatResult(title, input.url, body, links);
}
