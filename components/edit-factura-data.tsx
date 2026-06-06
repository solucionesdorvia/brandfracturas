"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFacturaData } from "@/app/(app)/facturas/actions";

export function EditFacturaData({
  id,
  initial,
}: {
  id: string;
  initial: {
    nroComprobante: string;
    fechaComprobante: string; // yyyy-mm-dd
    total: string;
    clienteNombre: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState(initial);

  function save() {
    startTransition(() => updateFacturaData(id, f));
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Corregir datos
      </Button>
    );
  }

  return (
    <div className="w-full rounded-md border bg-muted/30 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="e-nro">Nº de comprobante</Label>
          <Input
            id="e-nro"
            value={f.nroComprobante}
            onChange={(e) => setF({ ...f, nroComprobante: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-fecha">Fecha</Label>
          <Input
            id="e-fecha"
            type="date"
            value={f.fechaComprobante}
            onChange={(e) => setF({ ...f, fechaComprobante: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-total">Total</Label>
          <Input
            id="e-total"
            type="number"
            step="0.01"
            value={f.total}
            onChange={(e) => setF({ ...f, total: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-cliente">Cliente</Label>
          <Input
            id="e-cliente"
            value={f.clienteNombre}
            onChange={(e) => setF({ ...f, clienteNombre: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </Button>
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Guardando…" : "Guardar y regenerar"}
        </Button>
      </div>
    </div>
  );
}
