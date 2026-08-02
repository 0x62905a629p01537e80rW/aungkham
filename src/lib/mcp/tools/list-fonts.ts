import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { cdnJson, cdnUrl } from "../cdn";

type Check = { fonts?: { premium?: string[]; free?: string[] } };
type FreeIndex = { fonts?: string[] } | string[];

export default defineTool({
  name: "list_fonts",
  title: "List fonts",
  description:
    "List the Myanmar and English fonts available in the app's public font store, with their tier (free or premium) and download URL.",
  inputSchema: {
    tier: z.enum(["all", "free", "premium"]).default("all").describe("Filter fonts by tier."),
    limit: z.number().int().min(1).max(200).default(50).describe("Maximum number of fonts to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ tier, limit }) => {
    let premium: string[] = [];
    let free: string[] = [];
    try {
      const check = await cdnJson<Check>("Fonts/check.json");
      premium = check.fonts?.premium ?? [];
      free = check.fonts?.free ?? [];
    } catch (error) {
      throw new ToolError(`Could not read the font catalog: ${(error as Error).message}`);
    }
    try {
      const idx = await cdnJson<FreeIndex>("Freefonts/index.json");
      const extra = Array.isArray(idx) ? idx : (idx.fonts ?? []);
      free = [...free, ...extra];
    } catch {
      // Free pack is optional.
    }

    const rows = [
      ...(tier === "premium" ? [] : free.map((f) => ({ file: f, tier: "free" as const, url: cdnUrl(`Freefonts/${f}`) }))),
      ...(tier === "free" ? [] : premium.map((f) => ({ file: f, tier: "premium" as const, url: cdnUrl(`Fonts/${f}`) }))),
    ].slice(0, limit);

    return {
      content: [{ type: "text", text: JSON.stringify({ count: rows.length, fonts: rows }, null, 2) }],
      structuredContent: { count: rows.length, fonts: rows },
    };
  },
});
