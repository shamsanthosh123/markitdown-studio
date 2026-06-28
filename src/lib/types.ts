import type { ConvertResult } from "./convert";

export type JobStatus = "converting" | "done" | "error";

export interface Job {
  id: string;
  name: string;
  ext: string;
  size: number;
  status: JobStatus;
  result?: ConvertResult;
  error?: string;
}

export interface HistoryEntry {
  id: string;
  name: string;
  ext: string;
  tokenEstimate: number;
  markdown: string;
  at: number;
}
