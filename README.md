# Branded Docs

App interna para generar **presupuestos branded** desde plantilla y **envolver facturas legales** con una portada de marca.

Dos flujos:

1. **Presupuesto** → se cargan datos en un formulario y la app genera un PDF branded (plantillas `classic` / `modern`) renderizando HTML con Tailwind real vía Puppeteer.
2. **Factura** → se sube un PDF de factura legal ya emitida (con CAE) y la app le **antepone una portada branded**. El comprobante original queda intacto en las páginas 2+.

> **Regla dura:** la factura legal nunca se modifica, re-renderiza ni se le estampa nada. Solo se mergea una portada adelante (`pdf-lib` `copyPages`, que copia las páginas originales sin rasterizar ni alterar su contenido).

Todo cuelga de `tenantId` (`BrandProfile`) para escalar a multi-tenant sin reescribir. Hoy hay un solo tenant.

## Stack

Next.js 14 (App Router, TS) · Tailwind + shadcn/ui · Prisma + PostgreSQL · NextAuth (credentials) · Puppeteer (render HTML→PDF) · pdf-lib (merge) · zod + Server Actions.

## Requisitos

- Node 22+
- Una base PostgreSQL (en dev se usa un contenedor Docker dedicado).

## Puesta en marcha (dev)

```bash
# 1) Postgres dedicado (si no lo tenés corriendo)
docker run -d --name branded-docs-db \
  -e POSTGRES_USER=branded -e POSTGRES_PASSWORD=branded -e POSTGRES_DB=branded_docs \
  -p 54337:5432 postgres:16

# 2) Dependencias
npm install

# 3) Migración + seed (BrandProfile de ejemplo + usuario único)
npm run db:migrate
npm run db:seed

# 4) Dev
npm run dev
```

Abrir http://localhost:3000 e ingresar con las credenciales del seed:

- **Email:** `prueba@ger.com`
- **Password:** `prueba123`

(Se configuran en `.env` → `SEED_USER_EMAIL` / `SEED_USER_PASSWORD`.)

## Variables de entorno (`.env`)

| Var | Descripción |
|-----|-------------|
| `DATABASE_URL` | Connection string de Postgres |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Config de NextAuth |
| `DEFAULT_TENANT_ID` | Id del `BrandProfile` activo (lo imprime el seed) |
| `RENDER_BASE_URL` | Base URL que usa Puppeteer para las rutas de render (`http://localhost:3000` en dev) |
| `STORAGE_DIR` | Directorio del Storage local (`./storage`) |
| `PUPPETEER_USE_SPARTICUZ` | `1` para usar `@sparticuz/chromium` en prod (ver abajo) |

## Cómo funciona el PDF

- `lib/pdf/render.ts` → `renderHtmlToPdf(pathname)`: Puppeteer navega a una ruta interna de render (`/render/...`, Tailwind real), espera `networkidle0` + fonts, e imprime A4 con `printBackground`.
- `lib/pdf/merge.ts` → `mergePdfs([portada, original])`: `pdf-lib` copia las páginas. La portada queda como hoja 1; la factura original, intacta en las hojas 2+.
- `lib/pdf/generate.ts` orquesta render + `Storage` + DB.

> **Sobre "byte-a-byte":** las páginas del original se copian **sin re-renderizar ni estampar nada** (se cumple la regla dura). Tras reescribir el contenedor PDF, un hash literal del archivo extraído no coincide con el original (cualquier merge re-muxea los objetos), pero el **archivo original guardado en Storage nunca se toca** (verificable por hash) y las páginas 2+ del branded conservan dimensiones y contenido del comprobante.

## Facturas: lectura automática

Al subir una factura **solo se elige el PDF**; la app:

- **Lee los datos** del comprobante (cliente, nº, fecha, total, letra, código,
  CAE y vto) desde el texto del PDF (`pdf-parse`), con heurísticas sobre las
  etiquetas de AFIP **y soporte de formatos no-ARCA**. Usa los datos del emisor
  (Identidad) para **excluirlos**: nunca asigna el CUIT/razón social del vendedor
  como si fueran del comprador.
- **Extrae el QR real** del comprobante (imagen embebida → `jsqr`; fallback
  rasterizando la página) y lo usa en la portada. Si no hay QR legible, lo
  reconstruye con los datos leídos.
- Genera la **portada estilo ARCA** (con el logo) y la mergea adelante. El
  original queda **intacto** en las páginas 2+.
- Si algo se leyó mal, en el detalle hay **“Corregir datos”** (regenera) y
  **“Eliminar”**.

**Robustez:** `pdf-lib` se carga con `ignoreEncryption` (muchas facturas vienen
encriptadas por permisos), Puppeteer corre como **browser singleton** con
relanzamiento ante crash y reintento, y el render tiene timeouts + fallback de
espera. Hay una suite de integración en `scripts/integration.mts`.

## Storage

`lib/storage` expone una interfaz `Storage { put, get }`. El MVP usa `LocalStorage` (disco, servido vía `/api/files/<key>`). Migrar a S3 = implementar la interfaz; el resto del código no cambia.

## Deploy en Railway

- Setear las env vars (incluido `RENDER_BASE_URL` apuntando a la URL pública).
- Si Chromium consume mucha memoria, setear `PUPPETEER_USE_SPARTICUZ=1`, instalar `puppeteer-core @sparticuz/chromium` y habilitar la rama ya documentada en `lib/pdf/browser.ts`.
- El `Storage` local necesita un volumen persistente (o migrar a S3).

## Scripts

```bash
npm run dev          # desarrollo
npm run build        # build de producción
npm run db:migrate   # prisma migrate dev
npm run db:seed      # tenant + usuario
npm run db:studio    # Prisma Studio
```
