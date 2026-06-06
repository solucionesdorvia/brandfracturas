"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFactura } from "@/app/(app)/facturas/actions";

export function FacturaForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createFactura(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/facturas/${res.id}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Factura legal (PDF)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="archivo">Archivo PDF con CAE ya emitido</Label>
          <Input
            id="archivo"
            name="archivo"
            type="file"
            accept="application/pdf,.pdf"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          {fileName && (
            <p className="text-sm text-muted-foreground">Seleccionado: {fileName}</p>
          )}
          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Lectura automática</p>
            <p className="mt-1">
              Al subir, la app lee el comprobante y detecta cliente, nº, fecha y
              total para armar la portada. No hace falta cargar nada a mano.
            </p>
            <p className="mt-1">
              El comprobante original no se modifica: queda intacto en las hojas 2+.
              Si algún dato se leyó mal, lo podés corregir después.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        {pending && (
          <span className="text-sm text-muted-foreground">
            Leyendo el comprobante y armando la portada… puede tardar unos segundos.
          </span>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Procesando…" : "Subir y generar portada"}
        </Button>
      </div>
    </form>
  );
}
