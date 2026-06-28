import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ConvertSettings {
  skipImages: boolean;
  cleanWhitespace: boolean;
  stripHtml: boolean;
  maxTokens: number; // 0 = no limit
}

export const DEFAULT_SETTINGS: ConvertSettings = {
  skipImages: false,
  cleanWhitespace: true,
  stripHtml: false,
  maxTokens: 0,
};

export interface ConvertResult {
  markdown: string;
  tokenEstimate: number;
  originalSize: number;
  originalTokenEstimate: number;
  reductionPercent: number;
}

export const SUPPORTED_EXTENSIONS = [
  "pdf",
  "docx",
  "xlsx",
  "xls",
  "pptx",
  "txt",
  "md",
  "html",
  "htm",
  "csv",
  "json",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "epub",
  "wav",
  "mp3",
] as const;

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function estimateTokens(text: string): number {
  return Math.max(0, Math.ceil(text.length / 4));
}

export function getExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function buildTurndown(settings: ConvertSettings): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  td.use(gfm);
  if (settings.skipImages) {
    td.addRule("skipImages", {
      filter: "img",
      replacement: () => "",
    });
  }
  return td;
}

function cleanup(md: string, settings: ConvertSettings): string {
  let out = md;
  if (settings.stripHtml) {
    out = out.replace(/<\/?[^>]+(>|$)/g, "");
  }
  if (settings.cleanWhitespace) {
    out = out
      .split("\n")
      .map((l) => l.replace(/[ \t]+$/g, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  if (settings.maxTokens > 0) {
    const maxChars = settings.maxTokens * 4;
    if (out.length > maxChars) {
      out = out.slice(0, maxChars) + "\n\n> _[Output truncated at " + settings.maxTokens + " tokens]_";
    }
  }
  return out;
}

function csvToMarkdown(text: string): string {
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
  const rows = parsed.data as string[][];
  if (!rows.length) return "";
  const header = rows[0];
  const sep = header.map(() => "---");
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${sep.join(" | ")} |`,
    ...rows.slice(1).map((r) => `| ${r.map((c) => (c ?? "").replace(/\|/g, "\\|")).join(" | ")} |`),
  ];
  return lines.join("\n");
}

function jsonToMarkdown(text: string): string {
  try {
    const obj = JSON.parse(text);
    return "```json\n" + JSON.stringify(obj, null, 2) + "\n```";
  } catch {
    return "```\n" + text + "\n```";
  }
}

async function xlsxToMarkdown(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sections: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    sections.push(`## ${name}\n\n${csv.trim() ? csvToMarkdown(csv) : "_(empty)_"}`);
  }
  return sections.join("\n\n");
}

async function docxToMarkdown(file: File, settings: ConvertSettings): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
  return buildTurndown(settings).turndown(html);
}

async function pdfToMarkdown(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // @ts-expect-error worker entry
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push(`<!-- Page ${i} -->\n\n${text}`);
  }
  return pages.join("\n\n");
}

export async function convertFile(file: File, settings: ConvertSettings): Promise<ConvertResult> {
  const ext = getExtension(file.name);
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB — exceeds the 25MB limit.`);
  }
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new Error(`Unsupported file type ".${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`);
  }

  let markdown = "";

  switch (ext) {
    case "txt":
    case "md":
      markdown = await file.text();
      break;
    case "csv":
      markdown = csvToMarkdown(await file.text());
      break;
    case "json":
      markdown = jsonToMarkdown(await file.text());
      break;
    case "html":
    case "htm":
      markdown = buildTurndown(settings).turndown(await file.text());
      break;
    case "xlsx":
    case "xls":
      markdown = await xlsxToMarkdown(file);
      break;
    case "docx":
      markdown = await docxToMarkdown(file, settings);
      break;
    case "pdf":
      markdown = await pdfToMarkdown(file);
      break;
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
    case "gif": {
      if (settings.skipImages) {
        markdown = `![${file.name}](skipped)`;
      } else {
        const dataUrl = await fileToDataUrl(file);
        markdown = `![${file.name}](${dataUrl})`;
      }
      break;
    }
    case "pptx":
    case "epub":
    case "wav":
    case "mp3":
      throw new Error(
        `".${ext}" requires the full Microsoft MarkItDown engine. Run the included Python backend (see /backend) to convert this format.`,
      );
    default:
      throw new Error(`Unsupported file type ".${ext}".`);
  }

  markdown = cleanup(markdown, settings);
  const tokenEstimate = estimateTokens(markdown);
  const originalTokenEstimate = estimateTokens(`${file.size}`.length ? "x".repeat(file.size) : "");
  const reductionPercent =
    originalTokenEstimate > 0
      ? Math.max(0, Math.round((1 - tokenEstimate / originalTokenEstimate) * 100))
      : 0;

  return {
    markdown,
    tokenEstimate,
    originalSize: file.size,
    originalTokenEstimate,
    reductionPercent,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
