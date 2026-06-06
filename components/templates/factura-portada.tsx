import type { FacturaRenderData } from "@/lib/factura-data";
import { formatARS, formatDate } from "@/lib/format";

// Portada con layout fiel a un comprobante ARCA (recuadros emisor/receptor,
// letra central, totales y bloque CAE/QR), branded con el logo del emisor.
// Es una carátula que se antepone al comprobante fiscal original (intacto en
// las páginas siguientes); no reemplaza al comprobante legal.
export function FacturaPortada({
  data,
  qrDataUrl,
}: {
  data: FacturaRenderData;
  qrDataUrl?: string | null;
}) {
  const t = data.tenant;
  const letra = data.letra ?? "X";
  const cod = data.codComprobante ?? "—";
  const [ptoVta, nro] = (data.nroComprobante ?? "").split("-");

  return (
    <div
      className="mx-auto bg-white text-[11px] text-black"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "12mm 12mm",
        fontFamily: `${t.fontFamily}, Arial, sans-serif`,
      }}
    >
      <div className="border border-black">
        {/* Encabezado: emisor | letra | comprobante */}
        <div className="relative grid grid-cols-2">
          {/* Letra central */}
          <div className="absolute left-1/2 top-0 z-10 flex h-[26mm] w-[20mm] -translate-x-1/2 flex-col items-center justify-center border-x border-b border-black bg-white">
            <div className="text-[34px] font-bold leading-none">{letra}</div>
            <div className="mt-1 text-[8px]">COD. {cod}</div>
          </div>

          {/* Emisor (izquierda) */}
          <div className="border-r border-black pb-3 pl-5 pr-[14mm] pt-4">
            <div className="flex items-center gap-3">
              {t.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.logoUrl} alt={t.nombre} className="h-12 w-auto object-contain" />
              ) : null}
              <div className="text-[17px] font-bold">{t.razonSocial}</div>
            </div>
            <div className="mt-4 space-y-0.5 text-[10px]">
              <div>
                <span className="font-semibold">Razón social: </span>
                {t.razonSocial}
              </div>
              <div>
                <span className="font-semibold">Domicilio: </span>
                {t.domicilio}
              </div>
              <div>
                <span className="font-semibold">Condición frente al IVA: </span>
                {t.condicionIVA}
              </div>
            </div>
          </div>

          {/* Comprobante (derecha) */}
          <div className="pb-3 pl-[14mm] pr-5 pt-4">
            <div className="text-right text-[20px] font-bold uppercase tracking-wide">
              Factura
            </div>
            <div className="mt-3 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="font-semibold">Punto de Venta:</span>
                <span>{ptoVta ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Comp. Nro:</span>
                <span>{nro ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Fecha de Emisión:</span>
                <span>{data.fechaComprobante ? formatDate(data.fechaComprobante) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">CUIT:</span>
                <span>{t.cuit}</span>
              </div>
              {t.iibb && (
                <div className="flex justify-between">
                  <span className="font-semibold">Ingresos Brutos:</span>
                  <span>{t.iibb}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Receptor */}
        <div className="border-t border-black px-5 py-3 text-[10px]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            <div>
              <span className="font-semibold">CUIT: </span>
              {data.clienteCuit ?? "—"}
            </div>
            <div>
              <span className="font-semibold">Condición frente al IVA: </span>
              Consumidor Final / Resp. Inscripto
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Apellido y Nombre / Razón Social: </span>
              {data.clienteNombre ?? "—"}
            </div>
          </div>
        </div>

        {/* Detalle (resumen — el detalle completo está en el comprobante adjunto) */}
        <div className="border-t border-black">
          <div className="grid grid-cols-[1fr_120px] bg-neutral-100 text-[9px] font-semibold uppercase">
            <div className="px-5 py-1.5">Producto / Servicio</div>
            <div className="px-5 py-1.5 text-right">Importe</div>
          </div>
          <div className="grid grid-cols-[1fr_120px] text-[10px]">
            <div className="px-5 py-2">
              Comprobante fiscal — el detalle completo figura en el comprobante
              original adjunto.
            </div>
            <div className="px-5 py-2 text-right tabular-nums">
              {data.total != null ? formatARS(data.total) : "—"}
            </div>
          </div>
        </div>

        {/* Totales */}
        <div className="flex justify-end border-t border-black">
          <div className="w-[280px] px-5 py-3 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{data.total != null ? formatARS(data.total) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Importe Otros Tributos</span>
              <span className="tabular-nums">{formatARS(0)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-black pt-1 text-[13px] font-bold">
              <span>Importe Total</span>
              <span className="tabular-nums">{data.total != null ? formatARS(data.total) : "—"}</span>
            </div>
          </div>
        </div>

        {/* CAE / QR */}
        <div className="flex items-center gap-4 border-t border-black px-5 py-3">
          <div className="h-[28mm] w-[28mm] shrink-0 border border-neutral-300 p-1">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR AFIP" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-center text-[8px] text-neutral-400">
                QR no disponible
              </div>
            )}
          </div>
          <div className="text-[10px]">
            <div>
              <span className="font-semibold">CAE N°: </span>
              {data.cae ?? "—"}
            </div>
            <div>
              <span className="font-semibold">Fecha de Vto. de CAE: </span>
              {data.caeVto ? formatDate(data.caeVto) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Aclaración (carátula) */}
      <div className="mt-2 text-[8px] leading-snug text-neutral-500">
        Carátula de presentación generada por {t.razonSocial} a partir del
        comprobante fiscal original, que se adjunta sin modificaciones en las
        páginas siguientes. El comprobante con validez fiscal es el original
        adjunto. {[t.contactoEmail, t.contactoTel, t.contactoWeb].filter(Boolean).join(" · ")}
      </div>
    </div>
  );
}
