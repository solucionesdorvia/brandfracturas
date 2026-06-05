"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFactura } from "@/app/(app)/facturas/actions";

export function FacturaForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
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
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Factura legal (PDF)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
          <p className="text-xs text-muted-foreground">
            El comprobante original no se modifica: queda intacto en las hojas 2+.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de la portada</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nro">Nº de comprobante</Label>
            <Input id="nro" name="nroComprobante" placeholder="0001-00000123" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" name="fechaComprobante" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="total">Total</Label>
            <Input id="total" name="total" type="number" min={0} step="0.01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Input id="cliente" name="clienteNombre" required />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Procesando…" : "Subir y generar portada"}
        </Button>
      </div>
    </form>
  );
}
