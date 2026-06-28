import { useCallback, useEffect, useState } from "react";
import { FileText, History, Github, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UploadZone } from "./UploadZone";
import { BatchList } from "./BatchList";
import { OutputPanel } from "./OutputPanel";
import { SettingsSheet } from "./SettingsSheet";
import { FileIcon } from "./FileIcon";
import {
  convertFile,
  getExtension,
  estimateTokens,
  DEFAULT_SETTINGS,
  type ConvertSettings,
  type ConvertResult,
} from "@/lib/convert";
import { convertUrl } from "@/lib/convert-url.functions";
import type { Job, HistoryEntry } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const HISTORY_KEY = "mid-history";

export function StudioApp() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ConvertSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const pushHistory = useCallback((name: string, ext: string, result: ConvertResult) => {
    setHistory((prev) => {
      const next = [
        { id: crypto.randomUUID(), name, ext, tokenEstimate: result.tokenEstimate, markdown: result.markdown, at: Date.now() },
        ...prev,
      ].slice(0, 10);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const update = (id: string, patch: Partial<Job>) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const busy = jobs.some((j) => j.status === "converting");

  const handleFiles = useCallback(
    async (files: File[]) => {
      const newJobs: Job[] = files.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        ext: getExtension(f.name),
        size: f.size,
        status: "converting" as const,
      }));
      setJobs((prev) => [...newJobs, ...prev]);
      setActiveId(newJobs[0].id);

      await Promise.all(
        files.map(async (file, i) => {
          const id = newJobs[i].id;
          try {
            const result = await convertFile(file, settings);
            update(id, { status: "done", result });
            pushHistory(file.name, getExtension(file.name), result);
          } catch (err) {
            update(id, { status: "error", error: (err as Error).message });
          }
        }),
      );
    },
    [settings, pushHistory],
  );

  const handleUrl = useCallback(
    async (url: string) => {
      const id = crypto.randomUUID();
      const name = (() => {
        try {
          return new URL(url).hostname;
        } catch {
          return url;
        }
      })();
      setJobs((prev) => [
        { id, name, ext: "url", size: 0, status: "converting" as const },
        ...prev,
      ]);
      setActiveId(id);
      try {
        const result = (await convertUrl({ data: { url } })) as ConvertResult;
        update(id, { status: "done", result, size: result.originalSize });
        pushHistory(name, "url", result);
      } catch (err) {
        update(id, { status: "error", error: (err as Error).message });
      }
    },
    [pushHistory],
  );

  const handleText = useCallback(
    async (text: string, asHtml: boolean) => {
      const ext = asHtml ? "html" : "txt";
      const file = new File([text], `pasted.${ext}`, { type: "text/plain" });
      await handleFiles([file]);
    },
    [handleFiles],
  );

  const downloadAll = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    jobs
      .filter((j) => j.status === "done" && j.result)
      .forEach((j) => {
        zip.file(j.name.replace(/\.[^.]+$/, "") + ".md", j.result!.markdown);
      });
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "markitdown-export.zip";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Exported all conversions as ZIP");
  }, [jobs]);

  const remove = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const activeJob = jobs.find((j) => j.id === activeId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary p-1.5">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">MarkItDown Studio</h1>
              <p className="text-[11px] text-muted-foreground">File → LLM-friendly Markdown</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <History className="h-4 w-4" /> History
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-card p-0" align="end">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-sm font-medium">Recent (last 10)</span>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No conversions yet.
                  </p>
                ) : (
                  <ul className="max-h-80 overflow-auto">
                    {history.map((h) => (
                      <li
                        key={h.id}
                        className="flex items-center gap-2 border-b border-border px-3 py-2 last:border-0"
                      >
                        <FileIcon ext={h.ext} className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-xs">{h.name}</span>
                        <span className="font-mono text-[11px] text-success">
                          ~{formatNumber(h.tokenEstimate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </PopoverContent>
            </Popover>
            <SettingsSheet settings={settings} onChange={setSettings} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {jobs.length === 0 && (
          <div className="mx-auto max-w-2xl py-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Convert any file into clean Markdown
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Strip the noise. Get token-efficient Markdown ready to paste into any LLM.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="space-y-4">
            <div className="mx-auto w-full max-w-2xl">
              <UploadZone
                onFiles={handleFiles}
                onUrl={handleUrl}
                onText={handleText}
                busy={busy}
              />
            </div>
            <BatchList
              jobs={jobs}
              activeId={activeId}
              onSelect={setActiveId}
              onRemove={remove}
              onDownloadAll={downloadAll}
            />
          </div>

          <div className="min-h-[420px]">
            {activeJob ? (
              <OutputPanel job={activeJob} onClear={() => remove(activeJob.id)} />
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center text-muted-foreground">
                <FileText className="h-8 w-8 opacity-40" />
                <p className="mt-3 text-sm">Your Markdown output will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Github className="h-3.5 w-3.5" />
          Powered by Microsoft MarkItDown — full engine available via the included Python backend.
        </footer>
      </main>
    </div>
  );
}
