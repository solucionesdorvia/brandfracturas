"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { regeneratePresupuesto } from "@/app/(app)/presupuestos/actions";
import {
  PRESUPUESTO_TEMPLATES,
  type PresupuestoTemplateId,
} from "@/lib/presupuesto-templates";

export function RegeneratePresupuesto({
  id,
  current,
}: {
  id: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();

  function regen(template: PresupuestoTemplateId) {
    startTransition(() => regeneratePresupuesto(id, template));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Plantilla:</span>
      {PRESUPUESTO_TEMPLATES.map((t) => (
        <Button
          key={t.id}
          size="sm"
          variant={current === t.id ? "default" : "outline"}
          disabled={pending}
          onClick={() => regen(t.id)}
        >
          {t.label}
        </Button>
      ))}
      {pending && <span className="text-sm text-muted-foreground">Regenerando…</span>}
    </div>
  );
}
