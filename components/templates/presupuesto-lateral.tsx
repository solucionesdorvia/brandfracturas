import type { PresupuestoRenderData } from "@/lib/presupuesto-data";
import { formatARS, formatNum, formatDate } from "@/lib/format";

// Plantilla LATERAL: barra de color a la izquierda con el emisor (logo + datos
// fiscales + contacto) y el detalle del presupuesto a la derecha.
export function PresupuestoLateral({ data }: { data: PresupuestoRenderData }) {
  const t = data.tenant;
  const validoHasta = new Date(data.fecha);
  validoHasta.setDate(validoHasta.getDate() + data.validezDias);

  return (
    <div
      className="mx-auto flex bg-white text-[11px] text-neutral-800"
      style={{
        width: "210mm",
        minHeight: "297mm",
        fontFamily: `${t.fontFamily}, system-ui, sans-serif`,
      }}
    >
      {/* Barra lateral */}
      <aside
        className="flex w-[58mm] flex-col justify-between px-6 py-8 text-white"
        style={{ backgroundColor: t.colorPrimary }}
      >
        <div>
          {t.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.logoUrl} alt={t.nombre} className="mb-4 h-14 w-auto object-contain" />
          ) : null}
          <div className="text-[15px] font-bold leading-tight">{t.razonSocial}</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/60">{t.nombre}</div>

          <div className="mt-8 space-y-4 text-[10px] text-white/85">
            <div>
              <div className="text-[8px] uppercase tracking-widest text-white/50">Datos fiscales</div>
              <div className="mt-1">CUIT {t.cuit}</div>
              <div>{t.condicionIVA}</div>
              {t.iibb && <div>IIBB {t.iibb}</div>}
            </div>
            <div>
              <div className="text-[8px] uppercase tracking-widest text-white/50">Domicilio</div>
              <div className="mt-1">{t.domicilio}</div>
            </div>
            <div>
              <div className="text-[8px] uppercase tracking-widest text-white/50">Contacto</div>
              {t.contactoEmail && <div className="mt-1">{t.contactoEmail}</div>}
              {t.contactoTel && <div>{t.contactoTel}</div>}
              {t.contactoWeb && <div>{t.contactoWeb}</div>}
            </div>
          </div>
        </div>
        <div className="h-1 w-12 rounded" style={{ backgroundColor: t.colorAccent }} />
      </aside>

      {/* Contenido */}
      <div className="flex-1 px-9 py-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[24px] font-bold tracking-tight" style={{ color: t.colorPrimary }}>
              Presupuesto
            </div>
            <div className="text-[11px] text-neutral-500">N° {data.numero}</div>
          </div>
          <div className="text-right text-[10px] text-neutral-500">
            <div><span className="text-neutral-400">Fecha: </span>{formatDate(data.fecha)}</div>
            <div><span className="text-neutral-400">Validez: </span>{data.validezDias} días</div>
            <div><span className="text-neutral-400">Hasta: </span>{formatDate(validoHasta)}</div>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-neutral-200 p-3">
          <div className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Cliente</div>
          <div className="mt-1 text-[12px] font-semibold text-neutral-900">{data.clienteNombre}</div>
          <div className="text-[10px] text-neutral-600">
            {[data.cliente.cuit && `CUIT ${data.cliente.cuit}`, data.cliente.direccion, data.cliente.email, data.cliente.tel].filter(Boolean).join(" · ")}
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="text-[8.5px] uppercase tracking-wider text-neutral-400" style={{ borderBottom: `2px solid ${t.colorPrimary}` }}>
              <th className="py-2 text-left font-semibold">Descripción</th>
              <th className="py-2 text-right font-semibold">Cant.</th>
              <th className="py-2 text-right font-semibold">P. unit.</th>
              <th className="py-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.id} className="border-b border-neutral-100">
                <td className="py-2.5">{it.descripcion}</td>
                <td className="py-2.5 text-right tabular-nums">{formatNum(it.cantidad)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatNum(it.precioUnit)}</td>
                <td className="py-2.5 text-right font-medium tabular-nums">{formatNum(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 flex justify-end">
          <div className="w-64 text-[11px]">
            <div className="flex justify-between py-0.5 text-neutral-500"><span>Subtotal</span><span className="tabular-nums">{formatARS(data.subtotal)}</span></div>
            <div className="flex justify-between py-0.5 text-neutral-500"><span>IVA (informativo)</span><span className="tabular-nums">{formatARS(data.ivaInformativo)}</span></div>
            <div className="mt-1 flex justify-between rounded px-3 py-2 text-[13px] font-bold text-white" style={{ backgroundColor: t.colorPrimary }}>
              <span>Total</span><span className="tabular-nums">{formatARS(data.total)}</span>
            </div>
          </div>
        </div>

        {(data.condiciones || data.notas) && (
          <div className="mt-8 space-y-3 text-[10px] text-neutral-600">
            {data.condiciones && (<div><div className="font-semibold text-neutral-700">Condiciones</div><div className="whitespace-pre-line">{data.condiciones}</div></div>)}
            {data.notas && (<div><div className="font-semibold text-neutral-700">Notas</div><div className="whitespace-pre-line">{data.notas}</div></div>)}
          </div>
        )}

        <div className="mt-12 flex justify-end">
          <div className="w-56 text-center">
            <div className="border-t border-neutral-400 pt-1 text-[10px] text-neutral-600">Por {t.razonSocial}</div>
            <div className="text-[9px] text-neutral-400">Firma y aclaración</div>
          </div>
        </div>
      </div>
    </div>
  );
}
