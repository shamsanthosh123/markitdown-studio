import { Settings2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { ConvertSettings } from "@/lib/convert";

interface Props {
  settings: ConvertSettings;
  onChange: (s: ConvertSettings) => void;
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export function SettingsSheet({ settings, onChange }: Props) {
  const set = (patch: Partial<ConvertSettings>) => onChange({ ...settings, ...patch });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card">
        <SheetHeader>
          <SheetTitle>Conversion Settings</SheetTitle>
          <SheetDescription>Tune how files are converted to Markdown.</SheetDescription>
        </SheetHeader>
        <div className="mt-2 px-4">
          <Row label="Skip images" desc="Drop images instead of embedding base64 data.">
            <Switch
              checked={settings.skipImages}
              onCheckedChange={(v) => set({ skipImages: v })}
            />
          </Row>
          <Row
            label="Clean whitespace"
            desc="Collapse blank lines and trim trailing spaces."
          >
            <Switch
              checked={settings.cleanWhitespace}
              onCheckedChange={(v) => set({ cleanWhitespace: v })}
            />
          </Row>
          <Row label="Strip HTML tags" desc="Remove any leftover raw HTML from output.">
            <Switch
              checked={settings.stripHtml}
              onCheckedChange={(v) => set({ stripHtml: v })}
            />
          </Row>
          <Row
            label="Max output tokens"
            desc="Truncate output at N tokens. 0 = no limit."
          >
            <Input
              type="number"
              min={0}
              className="w-24 font-mono"
              value={settings.maxTokens}
              onChange={(e) => set({ maxTokens: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Row>
        </div>
      </SheetContent>
    </Sheet>
  );
}
