<div align="center">

<h1>sfmcp</h1>

<p>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-compatible-5a67d8?style=for-the-badge" alt="MCP Compatible"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Resources-139-f59e0b?style=for-the-badge" alt="139 Resources">
  <img src="https://img.shields.io/badge/Tools-11-ef4444?style=for-the-badge" alt="11 Tools">
</p>

<strong>An MCP server that turns justmovetosf.com into a conversational relocation guide for Claude Desktop and Cursor.</strong>

<p>
  <a href="#why">Why</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="#features">Features</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="#how-it-works">How It Works</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="#install">Install</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="#usage">Usage</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="#roadmap">Roadmap</a>
</p>

<br>

<!-- Replace with your demo GIF: <img src="docs/demo.gif" width="100%" alt="sfmcp demo in Claude Desktop"> -->

</div>

## Why

[justmovetosf.com](https://justmovetosf.com/) is the best curated list of resources for founders moving to San Francisco. Adrianna Lakatos maintains 139 links across 12 categories -- housing, accelerators, fundraising, visa help, community, and more.

The problem is that it's a flat page. You can't ask it questions. You can't say "find me a hacker house under $2000 in the Mission" or "compare Y Combinator and South Park Commons" or "what do I need to know about O-1 visas." You have to scroll and click and hope you find what you need.

sfmcp fixes that. It wraps the site's data into MCP tools that Claude and Cursor can call. You ask a question in natural language. The AI searches, filters, compares, and fetches live content to give you a direct answer with links.

> [!NOTE]
> This project is not affiliated with justmovetosf.com. It indexes publicly available data to make it more accessible through AI assistants.

## Features

<details open>
<summary><strong>Search and Discovery</strong></summary>

<br>

Fuzzy search across all 139 resources with weighted scoring -- title matches rank higher than description matches. Filter by any of 12 categories, or browse an entire category at once to see everything available.

</details>

<details open>
<summary><strong>Personalized Recommendations</strong></summary>

<br>

Tell the AI your budget, visa status, and startup stage. It returns tailored picks -- housing in your price range, accelerators for your stage, visa resources if you're international. Cost estimates cover 6 neighborhoods and 4 housing types.

</details>

<details open>
<summary><strong>Compare Side by Side</strong></summary>

<br>

Compare 2-5 neighborhoods, accelerators, or housing options in a structured table. Useful for decisions like Mission vs. Dogpatch or Y Combinator vs. South Park Commons.

</details>

<details>
<summary><strong>Investor Search</strong></summary>

<br>

Search SF investors by stage, sector, check size, or keyword. Get detailed profiles with thesis, portfolio, and contact links. Filters from Pre-Seed through Series A.

</details>

<details>
<summary><strong>Relocation Guides</strong></summary>

<br>

Full-text guides on housing, fundraising, networking, visas, first 30 days, and more. Fetched live from the justmovetosf.com API so they're always current.

</details>

<details>
<summary><strong>Live Content Fetch</strong></summary>

<br>

Fetch and extract clean text from any URL -- useful when a resource link leads to a page the AI needs to read. The dataset can also be refreshed on demand to pull the latest resources from the site.

</details>

<details>
<summary><strong>Ready-Made Prompts</strong></summary>

<br>

Three prompt templates for common scenarios. `new-to-sf` builds a comprehensive relocation plan. `startup-checklist` generates a step-by-step launch checklist. `find-housing` runs a targeted housing search for your budget.

</details>

## How It Works

### Architecture

sfmcp runs as a local process that communicates over stdio. No HTTP server, no API keys, no network config. Claude Desktop or Cursor spawns the process and sends MCP messages through stdin/stdout.

### Data Model

The server uses a hybrid data strategy. On startup, it loads `data/resources.json` -- a pre-indexed snapshot of justmovetosf.com with 139 structured resources across 12 categories. Each resource has a title, URL, description, category, and tags.

For content that changes frequently -- guides, investor profiles -- the server fetches live from the site's API. The `refresh_data` tool re-scrapes the entire dataset and writes a fresh `resources.json` without restarting the server.

### Search

Search uses a custom fuzzy scorer with no external dependencies. Queries are tokenized and matched against title (3x weight), description (2x weight), and tags (1x weight). Exact matches score 1.0, prefix matches 0.7, substring matches 0.4.

### MCP Surface

| Layer | Count | Examples |
|-------|-------|---------|
| Resources | 13 | `sf://index`, `sf://housing`, `sf://accelerators` |
| Tools | 11 | `search_resources`, `estimate_costs`, `compare` |
| Prompts | 3 | `new-to-sf`, `startup-checklist`, `find-housing` |

## Install

```bash
git clone https://github.com/cwklurks/sfmcp.git
cd sfmcp
npm install
npm run build
```

The pre-indexed data ships with the repo. To refresh it from the live site:

```bash
npm run seed
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sfmcp": {
      "command": "node",
      "args": ["/absolute/path/to/sfmcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. The server will appear in the MCP tool list.

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "sfmcp": {
      "command": "node",
      "args": ["/absolute/path/to/sfmcp/dist/index.js"]
    }
  }
}
```

Restart Cursor. The tools are available in Composer and Chat.

## Usage

Once installed, ask your AI assistant anything about moving to SF. The tools are called automatically.

**Search for resources:**
> "Find coworking spaces in SOMA"

**Get a cost breakdown:**
> "How much does a studio in Hayes Valley cost per month, including food and transport?"

**Compare options:**
> "Compare Mission, Dogpatch, and Sunset for a founder on a $2500/month budget"

**Find investors:**
> "Show me pre-seed AI investors with check sizes under $500k"

**Use a prompt template:**
> Use the `new-to-sf` prompt with a $3000 budget and a 2-month timeline

### Development

```bash
npm test              # run tests
npm run test:coverage # coverage report
npm run dev           # tsc --watch
```

## Roadmap

- **Neighborhood deep-dives** -- structured profiles with walkability scores, commute times, vibe descriptions, and median rents sourced from live data
- **Event calendar integration** -- surface upcoming SF founder events, demo days, and meetups with date filtering
- **SSE transport** -- server-sent events transport for remote hosting alongside the existing stdio
- **npx support** -- publish to npm so users can run `npx sfmcp` without cloning

## License

MIT.
