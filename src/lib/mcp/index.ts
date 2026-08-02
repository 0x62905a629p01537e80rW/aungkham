import { defineMcp } from "@lovable.dev/mcp-js";
import getTemplatePack from "./tools/get-template-pack";
import listFonts from "./tools/list-fonts";
import listStoreAssets from "./tools/list-store-assets";

export default defineMcp({
  name: "production-2",
  title: "Production_2",
  version: "0.1.0",
  instructions:
    "Tools for the Myanmar/English photo & text editor app. Use `list_fonts` to browse the Myanmar and English font store, `list_store_assets` to browse templates, backgrounds, shapes and stickers, and `get_template_pack` to inspect a specific template pack.",
  tools: [listFonts, listStoreAssets, getTemplatePack],
});
