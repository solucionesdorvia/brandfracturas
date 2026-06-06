"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold">No se pudo completar la acción</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Ocurrió un problema. Reintentá; si sigue, recargá la página o volvé al
        dashboard.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Reintentar</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          Volver al dashboard
        </Button>
      </div>
    </div>
  );
}
