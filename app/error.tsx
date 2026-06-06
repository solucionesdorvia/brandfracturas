"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Tuvimos un problema al procesar esta acción. Podés reintentar; si
        persiste, volvé al inicio.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Reintentar</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          Ir al inicio
        </Button>
      </div>
    </div>
  );
}
