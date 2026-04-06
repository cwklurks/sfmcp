import { describe, it, expect, beforeAll } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { loadResources } from "../src/data/loader.js";
import { createServer } from "../src/server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../data/resources.json");

describe("MCP server integration", () => {
  let client: Client;

  beforeAll(async () => {
    loadResources(DATA_PATH);
    const server = createServer();

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("tools", () => {
    it("registers exactly 11 tools", async () => {
      const { tools } = await client.listTools();
      expect(tools).toHaveLength(11);
    });

    it("registers expected tool names", async () => {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name).sort();
      expect(names).toEqual([
        "browse_category",
        "compare",
        "estimate_costs",
        "fetch_live_content",
        "get_investor",
        "get_recommendations",
        "list_guides",
        "read_guide",
        "refresh_data",
        "search_investors",
        "search_resources",
      ]);
    });
  });

  describe("resources", () => {
    it("lists category resources", async () => {
      const { resources } = await client.listResources();
      expect(resources.length).toBeGreaterThanOrEqual(12);
    });

    it("includes expected category URIs", async () => {
      const { resources } = await client.listResources();
      const uris = resources.map((r) => r.uri);
      expect(uris).toContain("sf://housing");
      expect(uris).toContain("sf://accelerators");
      expect(uris).toContain("sf://fundraising");
    });
  });

  describe("prompts", () => {
    it("registers exactly 3 prompts", async () => {
      const { prompts } = await client.listPrompts();
      expect(prompts).toHaveLength(3);
    });

    it("registers expected prompt names", async () => {
      const { prompts } = await client.listPrompts();
      const names = prompts.map((p) => p.name).sort();
      expect(names).toEqual(["find-housing", "new-to-sf", "startup-checklist"]);
    });
  });
});
