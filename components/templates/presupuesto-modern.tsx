import type { PresupuestoRenderData } from "@/lib/presupuesto-data";
import { formatARS, formatNum, formatDate } from "@/lib/format";

// Plantilla MEMBRETE (banda de color). Formal, con presencia de marca: banda
// superior en el color primario, bloque de datos enmarcado, tabla densa,
// totales en caja bordeada, firma y pie. Sin tarjetas ni bloques tipo app.
export function PresupuestoModern({ data }: { data: PresupuestoRenderData }) {
  const t = data.tenant;
  const validoHasta = new Date(data.fecha);
  validoHasta.setDate(validoHasta.getDate() + data.validezDias);

  return (
    <div
      className="mx-auto flex flex-col bg-white text-[11px] text-neutral-900"
      style={{
        width: "210mm",
        minHeight: "297mm",
        fontFamily: `${t.fontFamily}, system-ui, sans-serif`,
      }}
    >
      {/* Banda de membrete */}
      <div
        className="flex items-center justify-between px-[16mm] py-5 text-white"
        style={{ backgroundColor: t.colorPrimary }}
      >
        <div className="flex items-center gap-3">
          {t.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.logoUrl} alt={t.nombre} className="h-11 w-auto object-contain" />
          ) : null}
          <div>
            <div className="text-[16px] font-semibold tracking-tight">{t.razonSocial}</div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-white/70">{t.nombre}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-semibold uppercase tracking-[0.22em]">Presupuesto</div>
          <div className="text-[10px] text-white/80">N° {data.numero}</div>
        </div>
      </div>
      <div className="h-[2px] w-full" style={{ backgroundColor: t.colorAccent }} />

      <div className="flex-1 px-[16mm] pb-[14mm] pt-6">
        {/* Emisor / documento */}
        <div className="flex justify-between text-[10px] text-neutral-600">
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

        {/* Cliente / referencia */}
        <div className="mt-5 grid grid-cols-2 border border-neutral-300">
          <div className="border-r border-neutral-300 p-3">
            <div className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Cliente
            </div>
            <div className="mt-1 text-[12px] font-semibold">{data.clienteNombre}</div>
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
            <tr
              className="text-[8.5px] uppercase tracking-[0.12em] text-white"
              style={{ backgroundColor: t.colorPrimary }}
            >
              <th className="w-[34px] py-1.5 pl-2 pr-2 text-left font-semibold">Ítem</th>
              <th className="py-1.5 pr-2 text-left font-semibold">Descripción</th>
              <th className="w-[60px] py-1.5 px-2 text-right font-semibold">Cant.</th>
              <th className="w-[90px] py-1.5 px-2 text-right font-semibold">P. unitario</th>
              <th className="w-[100px] py-1.5 pl-2 pr-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, i) => (
              <tr key={it.id} className="border-b border-neutral-200 align-top">
                <td className="py-1.5 pl-2 pr-2 text-neutral-400">{String(i + 1).padStart(2, "0")}</td>
                <td className="py-1.5 pr-2 text-neutral-800">{it.descripcion}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{formatNum(it.cantidad)}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{formatNum(it.precioUnit)}</td>
                <td className="py-1.5 pl-2 pr-2 text-right tabular-nums">{formatNum(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales en caja bordeada */}
        <div className="mt-3 flex justify-end">
          <table className="w-[260px] border border-neutral-300 text-[11px]">
            <tbody>
              <tr>
                <td className="px-3 py-1 text-neutral-500">Subtotal</td>
                <td className="px-3 py-1 text-right tabular-nums">{formatARS(data.subtotal)}</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="px-3 py-1 text-neutral-500">IVA (informativo)</td>
                <td className="px-3 py-1 text-right tabular-nums">{formatARS(data.ivaInformativo)}</td>
              </tr>
              <tr style={{ backgroundColor: t.colorPrimary }} className="text-white">
                <td className="px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide">Total</td>
                <td className="px-3 py-1.5 text-right text-[13px] font-semibold tabular-nums">
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
      </div>

      {/* Pie con banda */}
      <div
        className="px-[16mm] py-2 text-[8.5px] text-white"
        style={{ backgroundColor: t.colorPrimary }}
      >
        <div className="flex justify-between">
          <span>
            {t.razonSocial} · CUIT {t.cuit}
          </span>
          <span>{[t.contactoEmail, t.contactoTel, t.contactoWeb].filter(Boolean).join(" · ")}</span>
        </div>
      </div>
    </div>
  );
}
