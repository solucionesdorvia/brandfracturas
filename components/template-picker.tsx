"use client";

import { PRESUPUESTO_TEMPLATES } from "@/lib/presupuesto-templates";
import { cn } from "@/lib/utils";

// Mini-previews CSS de cada plantilla, pintadas con los colores de la marca.
function Thumb({ id, primary, accent }: { id: string; primary: string; accent: string }) {
  const line = "h-1 rounded-sm bg-neutral-200";
  if (id === "modern") {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded bg-white">
        <div className="h-4" style={{ backgroundColor: primary }} />
        <div className="h-[2px]" style={{ backgroundColor: accent }} />
        <div className="flex-1 space-y-1 p-2">
          <div className={line} /><div className={cn(line, "w-2/3")} /><div className={cn(line, "w-1/2")} />
        </div>
      </div>
    );
  }
  if (id === "minimal") {
    return (
      <div className="flex h-full flex-col gap-1.5 rounded bg-white p-2">
        <div className="flex items-center justify-between">
          <div className="h-1.5 w-8 rounded-sm bg-neutral-300" />
          <div className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: accent }} />
        </div>
        <div className="h-px w-full bg-neutral-200" />
        <div className="mt-2 space-y-1"><div className={line} /><div className={cn(line, "w-3/4")} /></div>
      </div>
    );
  }
  if (id === "lateral") {
    return (
      <div className="flex h-full overflow-hidden rounded bg-white">
        <div className="w-1/3" style={{ backgroundColor: primary }} />
        <div className="flex-1 space-y-1 p-2">
          <div className={cn(line, "w-1/2")} /><div className={line} /><div className={cn(line, "w-2/3")} />
        </div>
      </div>
    );
  }
  // classic
  return (
    <div className="flex h-full flex-col gap-1 rounded bg-white p-2">
      <div className="flex items-center justify-between">
        <div className="h-1.5 w-10 rounded-sm bg-neutral-700" />
        <div className="h-1.5 w-6 rounded-sm bg-neutral-400" />
      </div>
      <div className="h-[2px] w-full bg-neutral-800" />
      <div className="mt-1 space-y-1"><div className={line} /><div className={cn(line, "w-3/4")} /><div className={cn(line, "w-1/2")} /></div>
    </div>
  );
}

export function TemplatePicker({
  value,
  onChange,
  primary = "#1f2937",
  accent = "#c9a84c",
}: {
  value: string;
  onChange: (id: string) => void;
  primary?: string;
  accent?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {PRESUPUESTO_TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-lg border p-2 text-left transition-colors hover:border-foreground/40",
            value === t.id ? "border-foreground ring-2 ring-foreground/15" : "border-input",
          )}
        >
          <div className="h-20 w-full rounded border border-neutral-200 bg-neutral-50 p-1">
            <Thumb id={t.id} primary={primary} accent={accent} />
          </div>
          <div className="mt-2 text-sm font-medium">{t.label}</div>
          <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{t.description}</div>
        </button>
      ))}
    </div>
  );
}
