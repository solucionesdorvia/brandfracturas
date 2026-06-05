"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createPresupuesto } from "@/app/(app)/presupuestos/actions";
import { computeTotals } from "@/lib/validations/presupuesto";
import { formatARS } from "@/lib/format";

type ItemRow = { descripcion: string; cantidad: string; precioUnit: string };

const emptyItem: ItemRow = { descripcion: "", cantidad: "1", precioUnit: "0" };

export function PresupuestoForm({ defaultNumero }: { defaultNumero: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [numero, setNumero] = useState(defaultNumero);
  const [validezDias, setValidezDias] = useState("15");
  const [templateId, setTemplateId] = useState<"classic" | "modern">("classic");
  const [ivaPct, setIvaPct] = useState("21");

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteTel, setClienteTel] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [clienteCuit, setClienteCuit] = useState("");

  const [condiciones, setCondiciones] = useState("");
  const [notas, setNotas] = useState("");

  const [items, setItems] = useState<ItemRow[]>([{ ...emptyItem }]);

  const totals = useMemo(() => {
    const parsed = items.map((it) => ({
      cantidad: Number(it.cantidad) || 0,
      precioUnit: Number(it.precioUnit) || 0,
    }));
    return computeTotals(parsed, Number(ivaPct) || 0);
  }, [items, ivaPct]);

  function updateItem(idx: number, patch: Partial<ItemRow>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }
  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createPresupuesto({
        numero,
        validezDias: Number(validezDias),
        templateId,
        ivaPct: Number(ivaPct),
        clienteNombre,
        clienteEmail,
        clienteTel,
        clienteDireccion,
        clienteCuit,
        condiciones,
        notas,
        items: items.map((it) => ({
          descripcion: it.descripcion,
          cantidad: Number(it.cantidad),
          precioUnit: Number(it.precioUnit),
        })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/presupuestos/${res.id}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos del presupuesto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" value={numero} onChange={(e) => setNumero(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validez">Validez (días)</Label>
              <Input id="validez" type="number" min={1} value={validezDias} onChange={(e) => setValidezDias(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iva">IVA informativo (%)</Label>
              <Input id="iva" type="number" min={0} max={100} value={ivaPct} onChange={(e) => setIvaPct(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template">Plantilla</Label>
              <select
                id="template"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value as "classic" | "modern")}
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cliente">Nombre / Razón social</Label>
              <Input id="cliente" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cemail">Email</Label>
              <Input id="cemail" type="email" value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctel">Teléfono</Label>
              <Input id="ctel" value={clienteTel} onChange={(e) => setClienteTel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cdir">Dirección</Label>
              <Input id="cdir" value={clienteDireccion} onChange={(e) => setClienteDireccion(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ccuit">CUIT</Label>
              <Input id="ccuit" value={clienteCuit} onChange={(e) => setClienteCuit(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ítems</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="hidden gap-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_100px_140px_140px_40px]">
            <span>Descripción</span>
            <span>Cantidad</span>
            <span>Precio unit.</span>
            <span className="text-right">Subtotal</span>
            <span />
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_100px_140px_140px_40px] sm:items-center">
              <Input
                placeholder="Descripción"
                value={it.descripcion}
                onChange={(e) => updateItem(idx, { descripcion: e.target.value })}
                required
              />
              <Input
                type="number"
                min={0}
                step="any"
                value={it.cantidad}
                onChange={(e) => updateItem(idx, { cantidad: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                step="any"
                value={it.precioUnit}
                onChange={(e) => updateItem(idx, { precioUnit: e.target.value })}
              />
              <div className="text-right text-sm tabular-nums">
                {formatARS((Number(it.cantidad) || 0) * (Number(it.precioUnit) || 0))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(idx)}
                aria-label="Quitar ítem"
              >
                ✕
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            + Agregar ítem
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Condiciones y notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cond">Condiciones</Label>
              <Textarea id="cond" value={condiciones} onChange={(e) => setCondiciones(e.target.value)} placeholder="Forma de pago, plazos, etc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Totales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatARS(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA informativo ({ivaPct || 0}%)</span>
              <span className="tabular-nums">{formatARS(totals.ivaInformativo)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatARS(totals.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Generando…" : "Guardar y generar PDF"}
        </Button>
      </div>
    </form>
  );
}
