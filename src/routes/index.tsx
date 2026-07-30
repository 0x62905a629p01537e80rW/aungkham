import { createFileRoute } from "@tanstack/react-router";
import { Editor } from "@/components/editor/editor";

function HomePage() {
  return <Editor />;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Photo Editor : Add Text On Photo" },
      {
        name: "description",
        content:
          "Add beautiful, customizable text to your photos. Fonts, colors, stroke, shadow, texture, perspective.\nProfessional tool for editors",
      },
      { property: "og:title", content: "Photo Editor : Add Text On Photo" },
      {
        property: "og:description",
        content: "Add beautiful, customizable text to your photos. Fonts, colors, stroke, shadow, texture, perspective.\nProfessional tool for editors",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});
