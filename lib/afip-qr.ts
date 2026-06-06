import QRCode from "qrcode";

// Reconstruye el QR de AFIP (RG 4892) a partir de los datos del comprobante.
// El QR autoritativo es el del comprobante original adjunto; este se arma con
// los datos leídos y apunta al mismo verificador de AFIP.

type QrInput = {
  fecha?: Date | null;
  cuitEmisor?: string | null; // CUIT del emisor (con o sin guiones)
  nroComprobante?: string | null; // "0003-00004567"
  codComprobante?: string | null; // "006"
  total?: number | null;
  clienteCuit?: string | null;
  cae?: string | null;
};

function onlyDigits(s?: string | null): string {
  return (s ?? "").replace(/\D/g, "");
}

export function buildAfipQrUrl(input: QrInput): string | null {
  const cuit = onlyDigits(input.cuitEmisor);
  const nro = input.nroComprobante ?? "";
  const parts = nro.split("-");
  const ptoVta = Number(onlyDigits(parts[0]));
  const nroCmp = Number(onlyDigits(parts[1] ?? parts[0]));
  const tipoCmp = Number(onlyDigits(input.codComprobante)) || 0;
  const importe = input.total ?? 0;
  const cae = onlyDigits(input.cae);

  // Datos mínimos imprescindibles para un QR con sentido.
  if (!cuit || !ptoVta || !nroCmp || !importe || !cae || !input.fecha) {
    return null;
  }

  const recCuit = onlyDigits(input.clienteCuit);
  const data = {
    ver: 1,
    fecha: input.fecha.toISOString().slice(0, 10),
    cuit: Number(cuit),
    ptoVta,
    tipoCmp,
    nroCmp,
    importe: Number(importe),
    moneda: "PES",
    ctz: 1,
    tipoDocRec: recCuit ? 80 : 99,
    nroDocRec: recCuit ? Number(recCuit) : 0,
    tipoCodAut: "E",
    codAut: Number(cae),
  };

  const b64 = Buffer.from(JSON.stringify(data), "utf8").toString("base64");
  return `https://www.afip.gob.ar/fe/qr/?p=${b64}`;
}

export async function generateAfipQrDataUrl(
  input: QrInput,
): Promise<string | null> {
  const url = buildAfipQrUrl(input);
  if (!url) return null;
  try {
    return await QRCode.toDataURL(url, {
      margin: 0,
      width: 240,
      errorCorrectionLevel: "M",
    });
  } catch {
    return null;
  }
}
