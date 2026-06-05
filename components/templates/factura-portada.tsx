import type { FacturaRenderData } from "@/lib/factura-data";
import { formatARS, formatDate } from "@/lib/format";

// Portada branded que se antepone a la factura legal. NO reemplaza ni altera
// el comprobante: es la hoja 1; la factura original va en las hojas 2+.
export function FacturaPortada({ data }: { data: FacturaRenderData }) {
  const t = data.tenant;
  return (
    <div
      className="mx-auto flex flex-col bg-white text-neutral-800"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm 18mm",
        fontFamily: `${t.fontFamily}, system-ui, sans-serif`,
      }}
    >
      {/* Encabezado de marca */}
      <div
        className="flex items-center gap-5 border-b-2 pb-6"
        style={{ borderColor: t.colorAccent }}
      >
        {t.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.logoUrl} alt={t.nombre} className="h-20 w-auto object-contain" />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-lg text-2xl font-bold text-white"
            style={{ backgroundColor: t.colorPrimary }}
          >
            {t.nombre.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-2xl font-bold" style={{ color: t.colorPrimary }}>
            {t.razonSocial}
          </div>
          <div className="text-sm text-neutral-500">
            CUIT {t.cuit} · {t.condicionIVA}
          </div>
          <div className="text-sm text-neutral-500">{t.domicilio}</div>
        </div>
      </div>

      {/* Resumen del comprobante */}
      <div className="mt-12">
        <div className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Comprobante
        </div>
        <div
          className="mt-4 grid grid-cols-2 gap-6 rounded-xl border p-8"
          style={{ borderColor: t.colorAccent }}
        >
          <Field label="Cliente" value={data.clienteNombre ?? "—"} />
          <Field label="Nº de comprobante" value={data.nroComprobante ?? "—"} />
          <Field
            label="Fecha"
            value={data.fechaComprobante ? formatDate(data.fechaComprobante) : "—"}
          />
          <Field
            label="Total"
            value={data.total != null ? formatARS(data.total) : "—"}
            emphasis={t.colorPrimary}
          />
        </div>
      </div>

      {/* Datos de pago / contacto */}
      <div className="mt-10 grid grid-cols-2 gap-6 text-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Datos de contacto
          </div>
          <div className="mt-2 space-y-0.5 text-neutral-600">
            {t.contactoEmail && <div>{t.contactoEmail}</div>}
            {t.contactoTel && <div>{t.contactoTel}</div>}
            {t.contactoWeb && <div>{t.contactoWeb}</div>}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Datos fiscales
          </div>
          <div className="mt-2 space-y-0.5 text-neutral-600">
            <div>CUIT {t.cuit}</div>
            <div>{t.condicionIVA}</div>
            {t.iibb && <div>IIBB {t.iibb}</div>}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-auto pt-10">
        <div
          className="rounded-lg px-5 py-4 text-center text-sm font-medium text-white"
          style={{ backgroundColor: t.colorPrimary }}
        >
          Factura adjunta a continuación →
        </div>
        <div className="mt-3 text-center text-[10px] text-neutral-400">
          Esta portada acompaña al comprobante legal original, que se conserva
          sin modificaciones en las páginas siguientes.
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-neutral-400">{label}</div>
      <div
        className="mt-1 text-lg font-semibold"
        style={emphasis ? { color: emphasis } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
