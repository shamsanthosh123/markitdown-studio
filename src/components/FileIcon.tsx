import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode2,
  FileAudio,
  FileType2,
  File,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  pdf: FileType2,
  docx: FileText,
  txt: FileText,
  md: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  json: FileCode2,
  html: FileCode2,
  htm: FileCode2,
  pptx: FileType2,
  epub: FileText,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  webp: FileImage,
  gif: FileImage,
  wav: FileAudio,
  mp3: FileAudio,
  url: Globe,
};

export function FileIcon({ ext, className }: { ext: string; className?: string }) {
  const Icon = MAP[ext] ?? File;
  return <Icon className={className} />;
}
