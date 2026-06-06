import { mergePdfs, countPages } from "../lib/pdf/merge.ts";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { promises as fs } from "node:fs";

// portada (no encriptada, como la genera la app)
const pd = await PDFDocument.create();
const f = await pd.embedFont(StandardFonts.Helvetica);
pd.addPage([595,841]).drawText("PORTADA BRANDED",{x:40,y:780,size:14,font:f});
const portada = Buffer.from(await pd.save());

// original ENCRIPTADO (el que rompía)
const encrypted = await fs.readFile("/tmp/encrypted.pdf");

const branded = await mergePdfs([portada, encrypted]);
console.log("merge con original encriptado -> paginas:", await countPages(branded), "(esperado 2)");
console.log("header:", branded.subarray(0,5).toString());
