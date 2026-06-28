import { useCallback, useRef, useState } from "react";
import { Upload, Link2, Type, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUPPORTED_EXTENSIONS } from "@/lib/convert";

interface Props {
  onFiles: (files: File[]) => void;
  onUrl: (url: string) => void;
  onText: (text: string, asHtml: boolean) => void;
  busy: boolean;
}

export function UploadZone({ onFiles, onUrl, onText, busy }: Props) {
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [asHtml, setAsHtml] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles],
  );

  const accept = SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(",");

  return (
    <Tabs defaultValue="file" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="file" className="gap-2">
          <Upload className="h-4 w-4" /> File
        </TabsTrigger>
        <TabsTrigger value="url" className="gap-2">
          <Link2 className="h-4 w-4" /> URL
        </TabsTrigger>
        <TabsTrigger value="text" className="gap-2">
          <Type className="h-4 w-4" /> Text
        </TabsTrigger>
      </TabsList>

      <TabsContent value="file" className="mt-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={[
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 px-6 py-16 text-center transition-colors",
            busy ? "pulse-border" : dragging ? "border-primary bg-accent/40" : "border-border hover:border-primary/60",
          ].join(" ")}
        >
          <div className="rounded-full bg-accent p-4">
            {busy ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            ) : (
              <Upload className="h-7 w-7 text-primary" />
            )}
          </div>
          <p className="mt-4 text-base font-semibold">
            {busy ? "Converting…" : "Drop files here or click to browse"}
          </p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            PDF · DOCX · XLSX · CSV · JSON · HTML · TXT · images · and more. Multi-file batch
            supported. Max 25MB each.
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) onFiles(files);
              e.target.value = "";
            }}
          />
        </div>
      </TabsContent>

      <TabsContent value="url" className="mt-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && url.trim() && onUrl(url.trim())}
          />
          <Button disabled={busy || !url.trim()} onClick={() => onUrl(url.trim())}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Convert"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Fetches the page server-side and converts it to clean Markdown.
        </p>
      </TabsContent>

      <TabsContent value="text" className="mt-4 space-y-3">
        <Textarea
          placeholder="Paste raw text or HTML here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-40 font-mono text-sm"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={asHtml}
              onChange={(e) => setAsHtml(e.target.checked)}
              className="accent-primary"
            />
            Treat input as HTML
          </label>
          <Button disabled={busy || !text.trim()} onClick={() => onText(text, asHtml)}>
            Convert
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
