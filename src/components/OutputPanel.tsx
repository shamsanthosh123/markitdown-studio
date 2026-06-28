import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Download,
  Check,
  Eye,
  Code,
  Sparkles,
  TrendingDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileIcon } from "./FileIcon";
import type { Job } from "@/lib/types";
import { formatBytes, formatNumber, MODEL_PRICING, estCost } from "@/lib/format";

interface Props {
  job: Job;
  onClear: () => void;
}

export function OutputPanel({ job, onClear }: Props) {
  const [view, setView] = useState<"preview" | "raw">("raw");
  const [copied, setCopied] = useState(false);
  const [model, setModel] = useState("GPT-4o");
  const md = job.result?.markdown ?? "";

  const copy = async () => {
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = job.name.replace(/\.[^.]+$/, "") + ".md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const costs = useMemo(() => {
    if (!job.result) return null;
    return {
      original: estCost(job.result.originalTokenEstimate, model),
      converted: estCost(job.result.tokenEstimate, model),
    };
  }, [job.result, model]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-accent p-2 shrink-0">
            <FileIcon ext={job.ext} className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{job.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(job.size)} · .{job.ext}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {job.status === "done" && (
            <Badge className="gap-1 bg-success/15 text-success border border-success/30 font-mono">
              <Sparkles className="h-3 w-3" /> ~{formatNumber(job.result!.tokenEstimate)} tokens
            </Badge>
          )}
        </div>
      </div>

      {job.status === "converting" && (
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Converting…
        </div>
      )}

      {job.status === "error" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="max-w-md text-sm text-muted-foreground">{job.error}</p>
          <Button variant="outline" size="sm" onClick={onClear}>
            Convert Another
          </Button>
        </div>
      )}

      {job.status === "done" && job.result && (
        <>
          {/* Token savings dashboard */}
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <Stat label="Original size" value={formatBytes(job.result.originalSize)} />
            <Stat
              label="Est. raw tokens"
              value={`~${formatNumber(job.result.originalTokenEstimate)}`}
            />
            <Stat
              label="Markdown tokens"
              value={`~${formatNumber(job.result.tokenEstimate)}`}
              accent
            />
            <Stat
              label="Reduction"
              value={`${job.result.reductionPercent}%`}
              icon={<TrendingDown className="h-3.5 w-3.5 text-success" />}
              success
            />
          </div>

          {/* Cost estimator */}
          {costs && (
            <div className="mx-4 mb-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">LLM cost:</span>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(MODEL_PRICING).map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="font-mono">
                <span className="text-muted-foreground line-through">
                  ${costs.original.toFixed(5)}
                </span>{" "}
                <span className="text-success">${costs.converted.toFixed(5)}</span>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 border-y border-border px-4 py-2">
            <Tabs value={view} onValueChange={(v) => setView(v as "preview" | "raw")}>
              <TabsList className="h-8">
                <TabsTrigger value="raw" className="h-6 gap-1 text-xs">
                  <Code className="h-3 w-3" /> Raw
                </TabsTrigger>
                <TabsTrigger value="preview" className="h-6 gap-1 text-xs">
                  <Eye className="h-3 w-3" /> Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={copy}>
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={download}>
                <Download className="h-3.5 w-3.5" /> .md
              </Button>
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear
              </Button>
            </div>
          </div>

          {/* Output */}
          <div className="flex-1 overflow-auto p-4">
            {view === "raw" ? (
              <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-foreground/90">
                {md}
              </pre>
            ) : (
              <div className="markdown-body prose prose-invert max-w-none text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  success,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={[
          "mt-0.5 flex items-center gap-1 font-mono text-base font-semibold",
          accent ? "text-primary" : success ? "text-success" : "text-foreground",
        ].join(" ")}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}
