import { createFileRoute } from "@tanstack/react-router";
import { Editor } from "@/components/editor/editor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Text on Photo — Free Native Photo Text Editor" },
      {
        name: "description",
        content:
          "Add beautiful, customizable text to your photos. Fonts, colors, stroke, shadow, texture, perspective — free, no signup, on-device.",
      },
      { property: "og:title", content: "Text on Photo" },
      {
        property: "og:description",
        content: "Add beautiful, customizable text to your photos — free, on-device.",
      },
    ],
  }),
  component: Editor,
});
