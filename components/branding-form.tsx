"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBranding } from "@/app/(app)/identidad/actions";
import { FONT_OPTIONS } from "@/lib/validations/branding";
import { extractPaletteFromImage } from "@/lib/extract-palette";

type BrandData = {
  nombre: string;
  razonSocial: string;
  cuit: string;
  domicilio: string;
  condicionIVA: string;
  iibb: string | null;
  contactoEmail: string | null;
  contactoTel: string | null;
  contactoWeb: string | null;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  fontFamily: string;
  logoUrl: string | null;
};

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
          aria-label={label}
        />
        <Input
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
        />
      </div>
    </div>
  );
}

export function BrandingForm({
  brand,
  isNew = false,
}: {
  brand: BrandData;
  isNew?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [primary, setPrimary] = useState(brand.colorPrimary);
  const [secondary, setSecondary] = useState(brand.colorSecondary);
  const [accent, setAccent] = useState(brand.colorAccent);
  const [font, setFont] = useState(brand.fontFamily);
  const [razon, setRazon] = useState(brand.razonSocial);
  const [nombre, setNombre] = useState(brand.nombre);

  const [logoPreview, setLogoPreview] = useState<string | null>(brand.logoUrl);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [paletteFromLogo, setPaletteFromLogo] = useState(false);

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoPreview(URL.createObjectURL(f));
    setRemoveLogo(false);
    // Sugerir paleta a partir del logo (editable después).
    const palette = await extractPaletteFromImage(f);
    if (palette) {
      setPrimary(palette.primary);
      setSecondary(palette.secondary);
      setAccent(palette.accent);
      setPaletteFromLogo(true);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("removeLogo", removeLogo ? "1" : "0");
    startTransition(async () => {
      const res = await updateBranding(fd);
      if (!res.ok) {
        setMsg({ ok: false, text: res.error });
        return;
      }
      if (res.created) {
        // Onboarding completo: vamos al dashboard.
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setMsg({ ok: true, text: "Identidad guardada. Los próximos documentos la usan." });
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted">
                {logoPreview && !removeLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">Sin logo</span>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={onLogoChange}
                />
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, SVG o WebP · máx 3 MB. Al subirlo, sugerimos una
                  paleta basada en tus colores.
                </p>
                {brand.logoUrl && (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={removeLogo}
                      onChange={(e) => setRemoveLogo(e.target.checked)}
                    />
                    Quitar el logo actual
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paleta + tipografía */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paleta y tipografía</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paletteFromLogo && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Paleta sugerida a partir de tu logo. Ajustá lo que quieras y guardá.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <ColorField id="colorPrimary" label="Primario" value={primary} onChange={setPrimary} />
              <ColorField id="colorSecondary" label="Secundario" value={secondary} onChange={setSecondary} />
              <ColorField id="colorAccent" label="Acento" value={accent} onChange={setAccent} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Tipografía (diseño)</Label>
              <select
                id="fontFamily"
                name="fontFamily"
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {FONT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                {/* por si el valor guardado no está en la lista */}
                {!FONT_OPTIONS.some((o) => o.value === font) && (
                  <option value={font}>{font}</option>
                )}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Datos fiscales / contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos del emisor</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de marca</Label>
              <Input id="nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón social</Label>
              <Input id="razonSocial" name="razonSocial" value={razon} onChange={(e) => setRazon(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT</Label>
              <Input id="cuit" name="cuit" defaultValue={brand.cuit} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condicionIVA">Condición IVA</Label>
              <Input id="condicionIVA" name="condicionIVA" defaultValue={brand.condicionIVA} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="domicilio">Domicilio</Label>
              <Input id="domicilio" name="domicilio" defaultValue={brand.domicilio} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iibb">IIBB</Label>
              <Input id="iibb" name="iibb" defaultValue={brand.iibb ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactoEmail">Email</Label>
              <Input id="contactoEmail" name="contactoEmail" type="email" defaultValue={brand.contactoEmail ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactoTel">Teléfono</Label>
              <Input id="contactoTel" name="contactoTel" defaultValue={brand.contactoTel ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactoWeb">Web</Label>
              <Input id="contactoWeb" name="contactoWeb" defaultValue={brand.contactoWeb ?? ""} />
            </div>
          </CardContent>
        </Card>

        {msg && (
          <p className={msg.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
            {msg.text}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending
              ? "Guardando…"
              : isNew
                ? "Crear marca y empezar"
                : "Guardar identidad"}
          </Button>
        </div>
      </div>

      {/* Preview en vivo */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">Vista previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="overflow-hidden rounded-md border"
              style={{ fontFamily: font }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3 text-white"
                style={{ backgroundColor: primary }}
              >
                {logoPreview && !removeLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="" className="h-7 w-auto object-contain" />
                ) : null}
                <span className="text-sm font-semibold">{razon || "Razón social"}</span>
              </div>
              <div className="h-[3px]" style={{ backgroundColor: accent }} />
              <div className="space-y-2 p-4" style={{ backgroundColor: secondary }}>
                <div className="text-xs uppercase tracking-widest text-neutral-400">
                  Presupuesto
                </div>
                <div className="text-sm font-semibold text-neutral-800">
                  {nombre || "Marca"}
                </div>
                <div className="h-px bg-neutral-200" />
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Total</span>
                  <span style={{ color: primary }} className="font-semibold">
                    $ 302.500,00
                  </span>
                </div>
                <div
                  className="mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: accent, color: primary }}
                >
                  Acento
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Es una referencia. El PDF final usa estos colores, tipografía y logo.
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
