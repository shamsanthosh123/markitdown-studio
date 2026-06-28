import { createServerFn } from "@tanstack/react-start";

export const convertUrl = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => {
    if (!data || typeof data.url !== "string" || !/^https?:\/\//i.test(data.url)) {
      throw new Error("Please provide a valid http(s) URL.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    let res: Response;
    try {
      res = await fetch(data.url, {
        headers: { "User-Agent": "Mozilla/5.0 (MarkItDown Studio)" },
      });
    } catch {
      throw new Error("Could not reach that URL. Check the address and try again.");
    }
    if (!res.ok) {
      throw new Error(`The page returned HTTP ${res.status}.`);
    }
    const html = await res.text();

    const TurndownService = (await import("turndown")).default;
    const { gfm } = await import("turndown-plugin-gfm");
    const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
    td.use(gfm);
    td.remove(["script", "style", "noscript", "iframe"]);

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const body = html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html;
    let markdown = td.turndown(body);
    if (titleMatch?.[1]) {
      markdown = `# ${titleMatch[1].trim()}\n\nSource: ${data.url}\n\n${markdown}`;
    }
    markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

    const originalSize = new TextEncoder().encode(html).length;
    return {
      markdown,
      tokenEstimate: Math.ceil(markdown.length / 4),
      originalSize,
      originalTokenEstimate: Math.ceil(html.length / 4),
      reductionPercent: Math.max(
        0,
        Math.round((1 - markdown.length / Math.max(1, html.length)) * 100),
      ),
    };
  });
