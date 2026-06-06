"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDelete({
  action,
  label = "Eliminar",
  confirmText = "¿Eliminar definitivamente? Esta acción no se puede deshacer.",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!armed) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:bg-destructive/10"
        onClick={() => setArmed(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1">
      <span className="text-xs text-muted-foreground">{confirmText}</span>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => action())}
      >
        {pending ? "Eliminando…" : "Sí, eliminar"}
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => setArmed(false)}>
        Cancelar
      </Button>
    </div>
  );
}
