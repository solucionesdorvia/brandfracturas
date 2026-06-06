import type { FacturaRenderData } from "@/lib/factura-data";
import { formatARS, formatDate } from "@/lib/format";

// Portada formal que se antepone a la factura legal. Documento sobrio tipo
// carátula: membrete, datos del comprobante enmarcados y nota de adjunto.
// NO reemplaza ni altera el comprobante: es la hoja 1, el original va en 2+.
export function FacturaPortada({ data }: { data: FacturaRenderData }) {
  const t = data.tenant;
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
        className="flex items-center justify-between px-[18mm] py-5 text-white"
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
        <div className="text-right text-[10px] text-white/80">
          <div>CUIT {t.cuit}</div>
          <div>{t.condicionIVA}</div>
        </div>
      </div>
      <div className="h-[2px] w-full" style={{ backgroundColor: t.colorAccent }} />

      <div className="flex-1 px-[18mm] pt-12">
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">
          Comprobante fiscal
        </div>
        <div className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
          Detalle del comprobante
        </div>

        {/* Datos del comprobante en grilla tipo formulario */}
        <div className="mt-8 border border-neutral-300">
          <Row label="Cliente" value={data.clienteNombre ?? "—"} />
          <Row label="N° de comprobante" value={data.nroComprobante ?? "—"} />
          <Row
            label="Fecha"
            value={data.fechaComprobante ? formatDate(data.fechaComprobante) : "—"}
          />
          <Row
            label="Importe total"
            value={data.total != null ? formatARS(data.total) : "—"}
            emphasis
            last
          />
        </div>

        {/* Datos de contacto / fiscales */}
        <div className="mt-10 grid grid-cols-2 gap-8 text-[10px]">
          <div>
            <div className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Contacto
            </div>
            <div className="mt-1 space-y-0.5 text-neutral-700">
              {t.contactoEmail && <div>{t.contactoEmail}</div>}
              {t.contactoTel && <div>{t.contactoTel}</div>}
              {t.contactoWeb && <div>{t.contactoWeb}</div>}
            </div>
          </div>
          <div>
            <div className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Datos del emisor
            </div>
            <div className="mt-1 space-y-0.5 text-neutral-700">
              <div>{t.razonSocial}</div>
              <div>CUIT {t.cuit} · {t.condicionIVA}</div>
              <div>{t.domicilio}</div>
              {t.iibb && <div>IIBB {t.iibb}</div>}
            </div>
          </div>
        </div>

        {/* Nota de adjunto */}
        <div className="mt-12 border-l-2 pl-4 text-[10px] text-neutral-600" style={{ borderColor: t.colorPrimary }}>
          El comprobante fiscal original, emitido conforme a la normativa vigente,
          se adjunta a continuación en las páginas siguientes y se conserva sin
          modificaciones.
        </div>
      </div>

      {/* Pie con banda */}
      <div
        className="px-[18mm] py-2 text-[8.5px] text-white"
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

function Row({
  label,
  value,
  emphasis,
  last,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={
        "grid grid-cols-[180px_1fr] " + (last ? "" : "border-b border-neutral-200")
      }
    >
      <div className="border-r border-neutral-200 bg-neutral-50 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div
        className={
          "px-4 py-3 " +
          (emphasis ? "text-[15px] font-semibold text-neutral-900" : "text-[12px] text-neutral-800")
        }
      >
        {value}
      </div>
    </div>
  );
}
