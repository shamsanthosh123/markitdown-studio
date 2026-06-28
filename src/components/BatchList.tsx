import { Loader2, CheckCircle2, XCircle, Download, FileArchive, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileIcon } from "./FileIcon";
import type { Job } from "@/lib/types";
import { formatNumber } from "@/lib/format";

interface Props {
  jobs: Job[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDownloadAll: () => void;
}

export function BatchList({ jobs, activeId, onSelect, onRemove, onDownloadAll }: Props) {
  if (!jobs.length) return null;
  const doneCount = jobs.filter((j) => j.status === "done").length;

  const downloadOne = (job: Job) => {
    if (!job.result) return;
    const blob = new Blob([job.result.markdown], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = job.name.replace(/\.[^.]+$/, "") + ".md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">
          Queue <span className="text-muted-foreground">({jobs.length})</span>
        </p>
        {doneCount > 1 && (
          <Button variant="outline" size="sm" className="gap-1" onClick={onDownloadAll}>
            <FileArchive className="h-3.5 w-3.5" /> ZIP all
          </Button>
        )}
      </div>
      <ul className="divide-y divide-border">
        {jobs.map((job) => (
          <li
            key={job.id}
            onClick={() => onSelect(job.id)}
            className={[
              "flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors",
              activeId === job.id ? "bg-accent/50" : "hover:bg-accent/25",
            ].join(" ")}
          >
            <FileIcon ext={job.ext} className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm">{job.name}</span>
            {job.status === "converting" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {job.status === "done" && (
              <>
                <span className="font-mono text-xs text-success">
                  ~{formatNumber(job.result!.tokenEstimate)}
                </span>
                <CheckCircle2 className="check-pop h-4 w-4 text-success" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadOne(job);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Download className="h-4 w-4" />
                </button>
              </>
            )}
            {job.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(job.id);
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
