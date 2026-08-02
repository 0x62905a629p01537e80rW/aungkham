import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { cdnJson } from "../cdn";

export default defineTool({
  name: "get_template_pack",
  title: "Get template pack",
  description:
    "Fetch one published template pack JSON from the app's public template store so its layers and styling can be inspected.",
  inputSchema: {
    file: z.string().trim().describe("Template pack file name, e.g. 'mm-pack-01.json' from list_store_assets."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ file }) => {
    if (file.includes("..") || file.includes("/")) throw new ToolError("File name must not contain path segments.");
    let pack: unknown;
    try {
      pack = await cdnJson<unknown>(`Templates/${file}`);
    } catch (error) {
      throw new ToolError(`Could not load template pack '${file}': ${(error as Error).message}`);
    }
    return { content: [{ type: "text", text: JSON.stringify(pack, null, 2) }] };
  },
});
