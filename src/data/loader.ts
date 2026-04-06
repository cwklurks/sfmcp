import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ResourceSchema, CATEGORY_INFO, CATEGORIES } from "../types.js";
import type { Resource, Category, CategoryId } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../../data/resources.json");

let cachedResources: readonly Resource[] = [];

export function loadResources(path?: string): readonly Resource[] {
  const filePath = path ?? DATA_PATH;
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    const validated = z.array(ResourceSchema).parse(parsed);
    cachedResources = Object.freeze(validated);
    return cachedResources;
  } catch (error: unknown) {
    throw new Error(
      `Failed to load resources from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function getAll(): readonly Resource[] {
  return [...cachedResources];
}

export function getByCategory(category: CategoryId): readonly Resource[] {
  return cachedResources.filter((r) => r.category === category);
}

export function getById(id: string): Resource | undefined {
  const found = cachedResources.find((r) => r.id === id);
  return found ? { ...found } : undefined;
}

export function getCategories(): readonly Category[] {
  return CATEGORIES.map((id) => ({
    id,
    name: CATEGORY_INFO[id].name,
    description: CATEGORY_INFO[id].description,
    resourceCount: cachedResources.filter((r) => r.category === id).length,
  }));
}

export function search(
  predicate: (resource: Resource) => boolean
): readonly Resource[] {
  return cachedResources.filter(predicate);
}

export function getResourceCount(): number {
  return cachedResources.length;
}

export function reloadResources(path?: string): readonly Resource[] {
  return loadResources(path);
}
