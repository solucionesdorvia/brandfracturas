import type { PresupuestoRenderData } from "@/lib/presupuesto-data";
import { formatARS, formatNum, formatDate } from "@/lib/format";

// Plantilla CORPORATIVA SOBRIA (monocromática). Documento formal tipo estudio
// de ingeniería: membrete con regla, bloque de datos enmarcado, tabla densa,
// bloque de firma y pie fiscal. Sin color dominante ni adornos.
export function PresupuestoClassic({ data }: { data: PresupuestoRenderData }) {
  const t = data.tenant;
  const validoHasta = new Date(data.fecha);
  validoHasta.setDate(validoHasta.getDate() + data.validezDias);

  return (
    <div
      className="mx-auto bg-white text-[11px] leading-relaxed text-neutral-900"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "16mm 16mm 14mm",
        fontFamily: `${t.fontFamily}, Georgia, serif`,
      }}
    >
      {/* Membrete */}
      <div className="flex items-end justify-between">
        <div className="flex items-end gap-3">
          {t.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.logoUrl} alt={t.nombre} className="h-12 w-auto object-contain" />
          ) : null}
          <div>
            <div className="text-[17px] font-semibold tracking-tight text-neutral-900">
              {t.razonSocial}
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              {t.nombre}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-semibold uppercase tracking-[0.2em] text-neutral-900">
            Presupuesto
          </div>
          <div className="text-[11px] text-neutral-600">N° {data.numero}</div>
        </div>
      </div>

      <div className="mt-2 border-t-2 border-neutral-900" />
      <div className="mt-px border-t border-neutral-300" />

      {/* Datos del emisor + documento */}
      <div className="mt-3 flex justify-between text-[10px] text-neutral-600">
        <div className="space-y-0.5">
          <div>CUIT {t.cuit} · {t.condicionIVA}</div>
          <div>{t.domicilio}</div>
          {t.iibb && <div>IIBB {t.iibb}</div>}
        </div>
        <div className="space-y-0.5 text-right">
          <div>
            <span className="text-neutral-400">Fecha de emisión: </span>
            {formatDate(data.fecha)}
          </div>
          <div>
            <span className="text-neutral-400">Validez: </span>
            {data.validezDias} días (hasta {formatDate(validoHasta)})
          </div>
        </div>
      </div>

      {/* Cliente / referencia en bloque enmarcado */}
      <div className="mt-5 grid grid-cols-2 border border-neutral-300">
        <div className="border-r border-neutral-300 p-3">
          <div className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Cliente
          </div>
          <div className="mt-1 text-[12px] font-semibold text-neutral-900">
            {data.clienteNombre}
          </div>
          <div className="mt-0.5 space-y-0.5 text-[10px] text-neutral-600">
            {data.cliente.cuit && <div>CUIT {data.cliente.cuit}</div>}
            {data.cliente.direccion && <div>{data.cliente.direccion}</div>}
            {(data.cliente.email || data.cliente.tel) && (
              <div>{[data.cliente.email, data.cliente.tel].filter(Boolean).join(" · ")}</div>
            )}
          </div>
        </div>
        <div className="p-3">
          <div className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Referencia
          </div>
          <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[10px] text-neutral-700">
            <span className="text-neutral-400">Documento</span>
            <span>Presupuesto N° {data.numero}</span>
            <span className="text-neutral-400">Moneda</span>
            <span>Pesos argentinos (ARS)</span>
          </div>
        </div>
      </div>

      {/* Detalle */}
      <table className="mt-5 w-full border-collapse text-[10.5px]">
        <thead>
          <tr className="border-y border-neutral-900 text-[8.5px] uppercase tracking-[0.12em] text-neutral-500">
            <th className="w-[34px] py-1.5 pr-2 text-left font-semibold">Ítem</th>
            <th className="py-1.5 pr-2 text-left font-semibold">Descripción</th>
            <th className="w-[60px] py-1.5 px-2 text-right font-semibold">Cant.</th>
            <th className="w-[90px] py-1.5 px-2 text-right font-semibold">P. unitario</th>
            <th className="w-[100px] py-1.5 pl-2 text-right font-semibold">Importe</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={it.id} className="border-b border-neutral-200 align-top">
              <td className="py-1.5 pr-2 text-neutral-400">{String(i + 1).padStart(2, "0")}</td>
              <td className="py-1.5 pr-2 text-neutral-800">{it.descripcion}</td>
              <td className="py-1.5 px-2 text-right tabular-nums">{formatNum(it.cantidad)}</td>
              <td className="py-1.5 px-2 text-right tabular-nums">{formatNum(it.precioUnit)}</td>
              <td className="py-1.5 pl-2 text-right tabular-nums">{formatNum(it.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="mt-3 flex justify-end">
        <table className="w-[260px] text-[11px]">
          <tbody>
            <tr>
              <td className="py-1 text-neutral-500">Subtotal</td>
              <td className="py-1 text-right tabular-nums">{formatARS(data.subtotal)}</td>
            </tr>
            <tr className="border-b border-neutral-300">
              <td className="py-1 text-neutral-500">IVA (informativo)</td>
              <td className="py-1 text-right tabular-nums">{formatARS(data.ivaInformativo)}</td>
            </tr>
            <tr className="border-b-2 border-neutral-900">
              <td className="py-1.5 text-[12px] font-semibold uppercase tracking-wide">Total</td>
              <td className="py-1.5 text-right text-[13px] font-semibold tabular-nums">
                {formatARS(data.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Condiciones */}
      {(data.condiciones || data.notas) && (
        <div className="mt-6 grid grid-cols-2 gap-8 text-[10px] text-neutral-700">
          {data.condiciones && (
            <div>
              <div className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Condiciones comerciales
              </div>
              <div className="mt-1 whitespace-pre-line leading-relaxed">{data.condiciones}</div>
            </div>
          )}
          {data.notas && (
            <div>
              <div className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Observaciones
              </div>
              <div className="mt-1 whitespace-pre-line leading-relaxed">{data.notas}</div>
            </div>
          )}
        </div>
      )}

      {/* Firma */}
      <div className="mt-12 flex justify-end">
        <div className="w-[230px] text-center">
          <div className="border-t border-neutral-400 pt-1 text-[10px] text-neutral-600">
            Por {t.razonSocial}
          </div>
          <div className="text-[9px] text-neutral-400">Firma y aclaración</div>
        </div>
      </div>

      {/* Pie */}
      <div className="mt-8 border-t border-neutral-300 pt-2 text-[8.5px] text-neutral-400">
        <div className="flex justify-between">
          <span>
            {t.razonSocial} · CUIT {t.cuit} · {t.condicionIVA}
          </span>
          <span>{[t.contactoEmail, t.contactoTel, t.contactoWeb].filter(Boolean).join(" · ")}</span>
        </div>
      </div>
    </div>
  );
}
