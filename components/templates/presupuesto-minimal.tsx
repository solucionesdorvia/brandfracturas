import type { PresupuestoRenderData } from "@/lib/presupuesto-data";
import { formatARS, formatNum, formatDate } from "@/lib/format";

// Plantilla MINIMALISTA: mucho aire, líneas finas, acento sutil de marca.
export function PresupuestoMinimal({ data }: { data: PresupuestoRenderData }) {
  const t = data.tenant;
  const validoHasta = new Date(data.fecha);
  validoHasta.setDate(validoHasta.getDate() + data.validezDias);

  return (
    <div
      className="mx-auto bg-white text-[11px] text-neutral-800"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "24mm 22mm",
        fontFamily: `${t.fontFamily}, system-ui, sans-serif`,
      }}
    >
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {t.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.logoUrl} alt={t.nombre} className="h-10 w-auto object-contain" />
          ) : null}
          <div className="text-[13px] font-semibold tracking-tight">{t.razonSocial}</div>
        </div>
        <div className="text-right">
          <div
            className="text-[10px] uppercase tracking-[0.35em]"
            style={{ color: t.colorAccent }}
          >
            Presupuesto
          </div>
          <div className="mt-1 text-[22px] font-light tracking-tight text-neutral-900">
            {data.numero}
          </div>
        </div>
      </div>

      <div className="mt-2 h-px w-full bg-neutral-200" />

      {/* Meta */}
      <div className="mt-8 grid grid-cols-3 gap-6 text-[10px]">
        <div>
          <div className="uppercase tracking-widest text-neutral-400">Para</div>
          <div className="mt-1 text-[12px] font-medium text-neutral-900">{data.clienteNombre}</div>
          {data.cliente.cuit && <div className="text-neutral-500">CUIT {data.cliente.cuit}</div>}
          {data.cliente.email && <div className="text-neutral-500">{data.cliente.email}</div>}
        </div>
        <div>
          <div className="uppercase tracking-widest text-neutral-400">Fecha</div>
          <div className="mt-1 text-neutral-700">{formatDate(data.fecha)}</div>
        </div>
        <div>
          <div className="uppercase tracking-widest text-neutral-400">Validez</div>
          <div className="mt-1 text-neutral-700">
            {data.validezDias} días · hasta {formatDate(validoHasta)}
          </div>
        </div>
      </div>

      {/* Ítems */}
      <table className="mt-10 w-full border-collapse">
        <thead>
          <tr className="text-[9px] uppercase tracking-widest text-neutral-400">
            <th className="border-b border-neutral-200 pb-2 text-left font-medium">Detalle</th>
            <th className="border-b border-neutral-200 pb-2 text-right font-medium">Cant.</th>
            <th className="border-b border-neutral-200 pb-2 text-right font-medium">P. unit.</th>
            <th className="border-b border-neutral-200 pb-2 text-right font-medium">Importe</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it) => (
            <tr key={it.id}>
              <td className="border-b border-neutral-100 py-3 text-neutral-800">{it.descripcion}</td>
              <td className="border-b border-neutral-100 py-3 text-right tabular-nums">{formatNum(it.cantidad)}</td>
              <td className="border-b border-neutral-100 py-3 text-right tabular-nums">{formatNum(it.precioUnit)}</td>
              <td className="border-b border-neutral-100 py-3 text-right tabular-nums">{formatNum(it.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 text-[11px]">
          <div className="flex justify-between py-1 text-neutral-500">
            <span>Subtotal</span><span className="tabular-nums">{formatARS(data.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 text-neutral-500">
            <span>IVA (informativo)</span><span className="tabular-nums">{formatARS(data.ivaInformativo)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-neutral-300 pt-3">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400">Total</span>
            <span className="text-[20px] font-light tabular-nums" style={{ color: t.colorPrimary }}>
              {formatARS(data.total)}
            </span>
          </div>
        </div>
      </div>

      {(data.condiciones || data.notas) && (
        <div className="mt-10 grid grid-cols-2 gap-8 text-[10px] text-neutral-600">
          {data.condiciones && (
            <div>
              <div className="uppercase tracking-widest text-neutral-400">Condiciones</div>
              <div className="mt-1 whitespace-pre-line leading-relaxed">{data.condiciones}</div>
            </div>
          )}
          {data.notas && (
            <div>
              <div className="uppercase tracking-widest text-neutral-400">Notas</div>
              <div className="mt-1 whitespace-pre-line leading-relaxed">{data.notas}</div>
            </div>
          )}
        </div>
      )}

      {/* Pie */}
      <div className="mt-16 flex items-center justify-between border-t border-neutral-200 pt-3 text-[9px] text-neutral-400">
        <span>{t.razonSocial} · CUIT {t.cuit}</span>
        <span>{[t.contactoEmail, t.contactoTel, t.contactoWeb].filter(Boolean).join("  ·  ")}</span>
      </div>
    </div>
  );
}
