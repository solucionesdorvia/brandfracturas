import type { PresupuestoRenderData } from "@/lib/presupuesto-data";
import { formatARS, formatDate } from "@/lib/format";

// Plantilla CLASSIC: sobria, encabezado con datos fiscales, tabla con líneas,
// acento en bordes. Consume el BrandProfile (colores, fuente, datos).
export function PresupuestoClassic({ data }: { data: PresupuestoRenderData }) {
  const t = data.tenant;
  const validoHasta = new Date(data.fecha);
  validoHasta.setDate(validoHasta.getDate() + data.validezDias);

  return (
    <div
      className="mx-auto bg-white text-[13px] text-neutral-800"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "18mm 16mm",
        fontFamily: `${t.fontFamily}, system-ui, sans-serif`,
      }}
    >
      {/* Encabezado */}
      <div
        className="flex items-start justify-between border-b-2 pb-5"
        style={{ borderColor: t.colorAccent }}
      >
        <div className="flex items-center gap-4">
          {t.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.logoUrl} alt={t.nombre} className="h-16 w-auto object-contain" />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded text-xl font-bold text-white"
              style={{ backgroundColor: t.colorPrimary }}
            >
              {t.nombre.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-lg font-bold" style={{ color: t.colorPrimary }}>
              {t.razonSocial}
            </div>
            <div className="text-[11px] text-neutral-500">
              CUIT {t.cuit} · {t.condicionIVA}
            </div>
            <div className="text-[11px] text-neutral-500">{t.domicilio}</div>
            {t.iibb && <div className="text-[11px] text-neutral-500">IIBB {t.iibb}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tracking-wide" style={{ color: t.colorPrimary }}>
            PRESUPUESTO
          </div>
          <div className="mt-1 text-sm font-medium">N° {data.numero}</div>
          <div className="text-[11px] text-neutral-500">Fecha: {formatDate(data.fecha)}</div>
          <div className="text-[11px] text-neutral-500">
            Válido hasta: {formatDate(validoHasta)} ({data.validezDias} días)
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className="mt-6">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          Cliente
        </div>
        <div className="mt-1 font-semibold">{data.clienteNombre}</div>
        <div className="text-[12px] text-neutral-600">
          {[data.cliente.cuit && `CUIT ${data.cliente.cuit}`, data.cliente.direccion]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <div className="text-[12px] text-neutral-600">
          {[data.cliente.email, data.cliente.tel].filter(Boolean).join(" · ")}
        </div>
      </div>

      {/* Ítems */}
      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: t.colorPrimary, color: "#fff" }}>
            <th className="p-2 text-left text-[11px] font-semibold uppercase">Descripción</th>
            <th className="p-2 text-right text-[11px] font-semibold uppercase">Cant.</th>
            <th className="p-2 text-right text-[11px] font-semibold uppercase">P. unit.</th>
            <th className="p-2 text-right text-[11px] font-semibold uppercase">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={it.id} className={i % 2 ? "bg-neutral-50" : ""}>
              <td className="border-b border-neutral-200 p-2">{it.descripcion}</td>
              <td className="border-b border-neutral-200 p-2 text-right tabular-nums">{it.cantidad}</td>
              <td className="border-b border-neutral-200 p-2 text-right tabular-nums">{formatARS(it.precioUnit)}</td>
              <td className="border-b border-neutral-200 p-2 text-right tabular-nums">{formatARS(it.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-[13px]">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span className="tabular-nums">{formatARS(data.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">IVA informativo</span>
            <span className="tabular-nums">{formatARS(data.ivaInformativo)}</span>
          </div>
          <div
            className="flex justify-between border-t-2 pt-1 text-base font-bold"
            style={{ borderColor: t.colorAccent, color: t.colorPrimary }}
          >
            <span>Total</span>
            <span className="tabular-nums">{formatARS(data.total)}</span>
          </div>
        </div>
      </div>

      {/* Condiciones / notas */}
      {(data.condiciones || data.notas) && (
        <div className="mt-8 space-y-3 text-[12px] text-neutral-600">
          {data.condiciones && (
            <div>
              <div className="font-semibold text-neutral-700">Condiciones</div>
              <div className="whitespace-pre-line">{data.condiciones}</div>
            </div>
          )}
          {data.notas && (
            <div>
              <div className="font-semibold text-neutral-700">Notas</div>
              <div className="whitespace-pre-line">{data.notas}</div>
            </div>
          )}
        </div>
      )}

      {/* Pie */}
      <div
        className="mt-10 border-t pt-3 text-center text-[10px] text-neutral-400"
        style={{ borderColor: t.colorAccent }}
      >
        {[t.contactoEmail, t.contactoTel, t.contactoWeb].filter(Boolean).join("  ·  ")}
      </div>
    </div>
  );
}
