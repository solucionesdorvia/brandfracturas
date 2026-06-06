"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { regeneratePresupuesto } from "@/app/(app)/presupuestos/actions";

export function RegeneratePresupuesto({
  id,
  current,
}: {
  id: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();

  function regen(template: "classic" | "modern") {
    startTransition(() => regeneratePresupuesto(id, template));
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Plantilla:</span>
      <Button
        size="sm"
        variant={current === "classic" ? "default" : "outline"}
        disabled={pending}
        onClick={() => regen("classic")}
      >
        Corporativo
      </Button>
      <Button
        size="sm"
        variant={current === "modern" ? "default" : "outline"}
        disabled={pending}
        onClick={() => regen("modern")}
      >
        Membrete
      </Button>
      {pending && <span className="text-sm text-muted-foreground">Regenerando…</span>}
    </div>
  );
}
