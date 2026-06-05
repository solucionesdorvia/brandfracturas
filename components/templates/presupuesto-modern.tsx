import type { PresupuestoRenderData } from "@/lib/presupuesto-data";
import { formatARS, formatDate } from "@/lib/format";

// Plantilla MODERN: banda de color lateral, tipografía grande, totales en
// bloque destacado. También consume el BrandProfile.
export function PresupuestoModern({ data }: { data: PresupuestoRenderData }) {
  const t = data.tenant;
  const validoHasta = new Date(data.fecha);
  validoHasta.setDate(validoHasta.getDate() + data.validezDias);

  return (
    <div
      className="mx-auto flex bg-white text-[13px] text-neutral-800"
      style={{
        width: "210mm",
        minHeight: "297mm",
        fontFamily: `${t.fontFamily}, system-ui, sans-serif`,
      }}
    >
      {/* Banda lateral de marca */}
      <aside
        className="flex w-[8mm] flex-col"
        style={{ backgroundColor: t.colorPrimary }}
      >
        <div className="h-1/3" style={{ backgroundColor: t.colorAccent }} />
      </aside>

      <div className="flex-1" style={{ padding: "18mm 16mm" }}>
        {/* Encabezado */}
        <div className="flex items-start justify-between">
          <div>
            <div
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: t.colorPrimary }}
            >
              Presupuesto
            </div>
            <div className="mt-1 text-sm text-neutral-500">N° {data.numero}</div>
          </div>
          <div className="flex items-center gap-3">
            {t.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.logoUrl} alt={t.nombre} className="h-14 w-auto object-contain" />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: t.colorAccent }}
              >
                {t.nombre.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Datos emisor + cliente */}
        <div className="mt-8 grid grid-cols-2 gap-6 text-[12px]">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              De
            </div>
            <div className="mt-1 font-semibold text-neutral-800">{t.razonSocial}</div>
            <div className="text-neutral-500">CUIT {t.cuit}</div>
            <div className="text-neutral-500">{t.condicionIVA}</div>
            <div className="text-neutral-500">{t.domicilio}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Para
            </div>
            <div className="mt-1 font-semibold text-neutral-800">{data.clienteNombre}</div>
            {data.cliente.cuit && <div className="text-neutral-500">CUIT {data.cliente.cuit}</div>}
            {data.cliente.direccion && <div className="text-neutral-500">{data.cliente.direccion}</div>}
            {data.cliente.email && <div className="text-neutral-500">{data.cliente.email}</div>}
            {data.cliente.tel && <div className="text-neutral-500">{data.cliente.tel}</div>}
          </div>
        </div>

        <div className="mt-4 flex gap-6 text-[11px] text-neutral-500">
          <span>Fecha: {formatDate(data.fecha)}</span>
          <span>Válido hasta: {formatDate(validoHasta)} ({data.validezDias} días)</span>
        </div>

        {/* Ítems */}
        <table className="mt-6 w-full border-collapse">
          <thead>
            <tr
              className="border-b-2 text-[10px] uppercase tracking-wider text-neutral-400"
              style={{ borderColor: t.colorPrimary }}
            >
              <th className="py-2 text-left font-semibold">Descripción</th>
              <th className="py-2 text-right font-semibold">Cant.</th>
              <th className="py-2 text-right font-semibold">P. unit.</th>
              <th className="py-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.id} className="border-b border-neutral-100">
                <td className="py-2.5">{it.descripcion}</td>
                <td className="py-2.5 text-right tabular-nums">{it.cantidad}</td>
                <td className="py-2.5 text-right tabular-nums">{formatARS(it.precioUnit)}</td>
                <td className="py-2.5 text-right font-medium tabular-nums">{formatARS(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales en bloque */}
        <div className="mt-6 flex justify-end">
          <div
            className="w-72 rounded-lg p-4 text-white"
            style={{ backgroundColor: t.colorPrimary }}
          >
            <div className="flex justify-between text-[12px] opacity-80">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatARS(data.subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-[12px] opacity-80">
              <span>IVA informativo</span>
              <span className="tabular-nums">{formatARS(data.ivaInformativo)}</span>
            </div>
            <div
              className="mt-2 flex justify-between border-t pt-2 text-lg font-bold"
              style={{ borderColor: t.colorAccent }}
            >
              <span>Total</span>
              <span className="tabular-nums">{formatARS(data.total)}</span>
            </div>
          </div>
        </div>

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

        <div className="mt-10 text-center text-[10px] text-neutral-400">
          {[t.contactoEmail, t.contactoTel, t.contactoWeb].filter(Boolean).join("  ·  ")}
        </div>
      </div>
    </div>
  );
}
