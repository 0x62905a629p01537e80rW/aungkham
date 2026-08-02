import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { cdnJson, cdnUrl } from "../cdn";

const FOLDERS = {
  templates: "Templates",
  backgrounds: "Backgrounds",
  shapes: "Shapes",
  stickers: "Stickers",
} as const;

type Index = { files?: string[]; items?: string[] } | string[];

export default defineTool({
  name: "list_store_assets",
  title: "List store assets",
  description:
    "List public asset-store items (templates, backgrounds, shapes or stickers) available for download in the app, with their CDN URLs.",
  inputSchema: {
    category: z.enum(["templates", "backgrounds", "shapes", "stickers"]).describe("Which asset store category to list."),
    limit: z.number().int().min(1).max(200).default(30).describe("Maximum number of assets to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ category, limit }) => {
    const folder = FOLDERS[category];
    let files: string[] = [];
    for (const name of ["check.json", "index.json"]) {
      try {
        const data = await cdnJson<Index>(`${folder}/${name}`);
        if (Array.isArray(data)) files = data;
        else files = data.files ?? data.items ?? [];
        if (files.length) break;
      } catch {
        // try the next manifest name
      }
    }
    if (!files.length) throw new ToolError(`No published manifest found for ${category}.`);

    const items = files.slice(0, limit).map((file) => ({ file, url: cdnUrl(`${folder}/${file}`) }));
    return {
      content: [{ type: "text", text: JSON.stringify({ category, count: items.length, items }, null, 2) }],
      structuredContent: { category, count: items.length, items },
    };
  },
});
