"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFacturaData } from "@/app/(app)/facturas/actions";

type Fields = {
  nroComprobante: string;
  fechaComprobante: string; // yyyy-mm-dd
  total: string;
  clienteNombre: string;
  clienteCuit: string;
  letra: string;
  codComprobante: string;
  cae: string;
  caeVto: string; // yyyy-mm-dd
};

export function EditFacturaData({
  id,
  initial,
}: {
  id: string;
  initial: Fields;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState(initial);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

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
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-3">
          <Label htmlFor="e-cliente">Cliente</Label>
          <Input id="e-cliente" value={f.clienteNombre} onChange={set("clienteNombre")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-cuit">CUIT cliente</Label>
          <Input id="e-cuit" value={f.clienteCuit} onChange={set("clienteCuit")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-letra">Letra</Label>
          <Input id="e-letra" value={f.letra} onChange={set("letra")} placeholder="A / B / C" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-cod">Cód. comprobante</Label>
          <Input id="e-cod" value={f.codComprobante} onChange={set("codComprobante")} placeholder="006" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-nro">Nº de comprobante</Label>
          <Input id="e-nro" value={f.nroComprobante} onChange={set("nroComprobante")} placeholder="0001-00000123" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-fecha">Fecha</Label>
          <Input id="e-fecha" type="date" value={f.fechaComprobante} onChange={set("fechaComprobante")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-total">Total</Label>
          <Input id="e-total" type="number" step="0.01" value={f.total} onChange={set("total")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-cae">CAE</Label>
          <Input id="e-cae" value={f.cae} onChange={set("cae")} placeholder="14 dígitos" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-caevto">Vto. CAE</Label>
          <Input id="e-caevto" type="date" value={f.caeVto} onChange={set("caeVto")} />
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
