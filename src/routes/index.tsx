import { createFileRoute } from "@tanstack/react-router";
import { StudioApp } from "@/components/StudioApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MarkItDown Studio — File to LLM-Friendly Markdown" },
      {
        name: "description",
        content:
          "Convert PDF, DOCX, XLSX, HTML, CSV, JSON and more into clean, token-efficient Markdown ready to paste into any LLM.",
      },
      { property: "og:title", content: "MarkItDown Studio" },
      {
        property: "og:description",
        content: "Convert rich files into clean, token-efficient Markdown for LLMs.",
      },
    ],
  }),
  component: StudioApp,
});
