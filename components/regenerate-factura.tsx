"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { regenerateFactura } from "@/app/(app)/facturas/actions";

export function RegenerateFactura({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => regenerateFactura(id))}
    >
      {pending ? "Regenerando…" : "Regenerar portada"}
    </Button>
  );
}
