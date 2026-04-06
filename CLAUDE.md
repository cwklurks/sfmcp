# SF MCP Server

MCP server that turns [justmovetosf.com](https://justmovetosf.com/) into an AI-powered SF relocation assistant.

## Quick Start

```bash
npm install
npm run seed    # Scrape site → data/resources.json
npm run build   # Compile TypeScript → dist/
npm start       # Run MCP server via stdio
npm test        # Run vitest tests
```

## Architecture

- **Transport**: stdio (local process, designed for Claude Desktop / Cursor)
- **Data**: Hybrid — pre-indexed JSON (`data/resources.json`) + live fetch capability
- **Stack**: TypeScript, `@modelcontextprotocol/sdk`, Cheerio, Zod, Vitest

## Key Paths

| Path | Purpose |
|------|---------|
| `src/index.ts` | Entry point — wires server + stdio transport |
| `src/server.ts` | McpServer setup — registers all resources, tools, prompts |
| `src/types.ts` | Zod schemas + TypeScript types |
| `src/data/loader.ts` | Loads resources.json, provides query helpers |
| `src/search/fuzzy.ts` | Lightweight fuzzy scoring (no external deps) |
| `src/scraper/` | Fetch + parse justmovetosf.com JS bundle |
| `src/tools/` | All 11 tool implementations |
| `data/resources.json` | Pre-indexed structured data (139 resources) |

## MCP Surface

**Resources**: `sf://index` (master list) + `sf://{category}` for each of 12 categories
**Tools**: search_resources, get_recommendations, fetch_live_content, refresh_data, estimate_costs, compare, list_guides, read_guide, search_investors, get_investor, browse_category
**Prompts**: new-to-sf, startup-checklist, find-housing

## Claude Desktop Config

```json
{
  "mcpServers": {
    "sfmcp": {
      "command": "node",
      "args": ["/Users/connork/code/sfmcp/dist/index.js"]
    }
  }
}
```

## Development Notes

- The site is a React SPA; data lives in a JS bundle, not static HTML
- The scraper regex-parses the minified bundle for section objects
- All data access is immutable — loader returns copies, never mutates
- Categories map 1:1 to section IDs from the site
