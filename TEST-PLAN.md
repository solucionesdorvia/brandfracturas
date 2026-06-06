# Test Plan — Branded Docs

App: https://app-production-800e.up.railway.app
Usuario de prueba: `prueba@ger.com` / `prueba123`

Prioridades: **P0** crítico (bloquea entrega) · **P1** importante · **P2** deseable.

Convención de resultado: ✅ pasa / ❌ falla / ⚠️ pasa con observación.

---

## 0. Preparación

- [ ] Tener a mano **2–3 facturas reales** de ARCA en PDF (idealmente: una Factura A, una B, y una de otro sistema de facturación).
- [ ] Tener una **factura escaneada** (imagen) si existe ese caso de uso.
- [ ] Un PDF cualquiera no-factura (para probar validaciones).
- [ ] El **logo** del cliente en alta resolución (PNG/SVG con fondo transparente).

---

## 1. Autenticación y acceso (P0)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|--------------------|
| AUTH-1 | Login OK | Ir a `/login`, ingresar credenciales válidas | Redirige al dashboard; el header muestra el nombre de usuario |
| AUTH-2 | Login inválido | Ingresar contraseña incorrecta | Mensaje "Credenciales inválidas"; no entra |
| AUTH-3 | Ruta protegida sin sesión | Abrir `/dashboard` en ventana incógnito | Redirige a `/login` |
| AUTH-4 | Logout | Click en "Salir" | Vuelve a `/login`; al intentar `/dashboard` redirige a login |
| AUTH-5 | Persistencia de sesión | Login, recargar la página | Sigue logueado |

---

## 2. Identidad / Branding (P0)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|--------------------|
| BRA-1 | Subir logo | Identidad → Logo → elegir archivo → Guardar | Muestra "Identidad guardada"; el logo aparece en la vista previa |
| BRA-2 | Logo en documentos | Tras subir logo, generar un presupuesto | El logo aparece en el membrete del PDF |
| BRA-3 | Cambiar colores | Cambiar Primario/Acento → Guardar → generar doc | El PDF usa los colores nuevos |
| BRA-4 | Cambiar tipografía | Elegir otra fuente → Guardar → generar doc | El PDF usa la fuente elegida |
| BRA-5 | Datos del emisor | Editar razón social/CUIT/domicilio → Guardar | Los datos nuevos salen en presupuestos y portadas |
| BRA-6 | Persistencia | Recargar Identidad | Los cambios siguen guardados |
| BRA-7 | Quitar logo | Tildar "Quitar el logo actual" → Guardar | Documentos vuelven a mostrar el placeholder de iniciales |
| BRA-8 | Validación color | Poner un hex inválido (ej. `123`) → Guardar | Mensaje de error; no guarda |

---

## 3. Presupuestos (P0)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|--------------------|
| PRE-1 | Crear básico | Nuevo presupuesto → cliente + 1 ítem → Guardar | Crea, redirige al detalle, muestra preview del PDF |
| PRE-2 | Ítems dinámicos | Agregar 3 ítems, quitar 1 | La tabla y los totales se actualizan en vivo |
| PRE-3 | Cálculo de totales | Cant. 2 × $35.000 + 1 × $180.000, IVA 21% | Subtotal $250.000, IVA $52.500, Total $302.500 |
| PRE-4 | Plantilla Corporativo | Elegir "Corporativo" → generar | PDF sobrio monocromático con membrete y firma |
| PRE-5 | Plantilla Membrete | En el detalle, botón "Membrete" | Regenera con banda de color; el preview cambia |
| PRE-6 | Descargar | Botón "Descargar PDF" | Baja un PDF A4 válido con los datos correctos |
| PRE-7 | Validación sin ítems | Intentar guardar sin ítems / sin cliente | Muestra error, no crea |
| PRE-8 | Condiciones/notas | Cargar condiciones y notas | Aparecen en el PDF |
| PRE-9 | Numeración | Crear 2 presupuestos seguidos | Numeración correlativa (P-AAAA-000X) |
| PRE-10 | Eliminar | Detalle → Eliminar → confirmar | Sale del dashboard; el PDF deja de estar disponible |
| PRE-11 | Fecha/validez | Verificar fecha de emisión y "válido hasta" | Fechas correctas (sin corrimiento de día) |

---

## 4. Facturas — lectura automática (P0)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|--------------------|
| FAC-1 | Subir factura ARCA | Nueva factura → subir PDF real → procesar | Extrae cliente, nº, fecha, total; genera portada |
| FAC-2 | **Original intacto** | Descargar branded; comparar páginas 2+ con el PDF subido | Hoja 1 = portada; hojas 2+ idénticas al original (mismo contenido, sin alteración) |
| FAC-3 | Portada estilo ARCA | Ver el branded | Recuadros emisor/receptor, letra, totales, bloque CAE/QR, con logo |
| FAC-4 | **QR real** | Escanear el QR de la portada con el celular | Lleva al verificador de AFIP con los datos del comprobante |
| FAC-5 | **Exclusión emisor** | Subir factura donde el CUIT del emisor también figura | El cliente NO queda con el CUIT/razón social del emisor |
| FAC-6 | Factura encriptada | Subir una factura con permisos/encriptación | Genera la portada sin error (no "falló la portada") |
| FAC-7 | Factura no-ARCA | Subir comprobante de otro sistema | Extrae lo que puede; genera portada; campos faltantes editables |
| FAC-8 | Corregir datos | Detalle → "Corregir datos" → editar → guardar | Regenera la portada con los datos corregidos |
| FAC-9 | Regenerar portada | Detalle → "Regenerar portada" | Vuelve a generar correctamente |
| FAC-10 | Ver original | Botón "Ver original" | Abre el PDF original subido, intacto |
| FAC-11 | Descargar branded | Botón "Descargar branded" | Baja el PDF (portada + original) |
| FAC-12 | Aviso de faltantes | Subir factura difícil de leer | Muestra aviso de campos no leídos + sugiere "Corregir datos" |
| FAC-13 | Eliminar | Detalle → Eliminar → confirmar | Sale del dashboard; archivos eliminados |

---

## 5. Dashboard (P1)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|--------------------|
| DSH-1 | Listado | Crear varios docs | Aparecen en sus tablas con datos correctos |
| DSH-2 | Contadores | Ver "X en total" | Coincide con la cantidad real |
| DSH-3 | Estados | Ver badges | Presupuesto "generated", factura "processed" en verde |
| DSH-4 | Links | Click "Ver" / "PDF" / "Branded" | Abren el detalle / descargan el PDF correcto |
| DSH-5 | Vacío | Sin documentos | Mensajes de estado vacío correctos |

---

## 6. Validaciones y errores (P1)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|--------------------|
| VAL-1 | Archivo no PDF | Subir un .jpg/.docx como factura | Rechaza ("no es un PDF válido") |
| VAL-2 | PDF muy grande | Subir un PDF > 25 MB | Rechaza con mensaje de límite |
| VAL-3 | Email cliente inválido | Presupuesto con email mal formado | Error de validación |
| VAL-4 | Logo muy grande | Subir imagen > 3 MB | Rechaza con mensaje |
| VAL-5 | Factura escaneada (imagen) | Subir factura sin texto | Campos vacíos + aviso; se completan con "Corregir datos" |

---

## 7. Producción / Infra (P1)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|--------------------|
| INF-1 | App online | Abrir la URL pública | Carga `/login` (HTTP 200) |
| INF-2 | Persistencia DB | Crear doc, esperar, recargar | El doc sigue ahí |
| INF-3 | Persistencia archivos | Tras un redeploy, abrir un PDF viejo | Sigue accesible (volumen `/data`) |
| INF-4 | PDF en la nube | Generar un presupuesto en producción | Chromium genera el PDF sin error (~5–15 s) |
| INF-5 | Auto-deploy | `git push` a `main` | Railway redeploya solo |
| INF-6 | HTTPS | Verificar candado | Certificado válido |

---

## 8. Seguridad (P1/P2)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|--------------------|
| SEC-1 | Archivos sin sesión | Abrir una URL `/api/files/...` directa | (Aceptable MVP: accesible por key no adivinable; documentar) |
| SEC-2 | Rutas internas de render | `/render/...` sin sesión | Accesible (las usa Puppeteer) — sin datos sensibles fuera del comprobante |
| SEC-3 | Secretos | Revisar repo público | No hay `.env` ni credenciales versionadas |
| SEC-4 | Fuerza bruta login | Varios intentos fallidos | (P2: evaluar rate-limiting a futuro) |

---

## 9. Compatibilidad (P2)

| ID | Caso | Resultado esperado |
|----|------|--------------------|
| CMP-1 | Chrome / Edge | Funciona |
| CMP-2 | Safari | Funciona (preview de PDF en iframe) |
| CMP-3 | Mobile | Formularios usables; PDFs descargables |

---

## Criterios de aceptación (del brief original)

1. **Presupuesto**: completar form → elegir plantilla → obtener PDF A4 branded con totales correctos y descargable. → cubre PRE-1..PRE-6
2. **Factura**: subir un PDF → hoja 1 portada branded; hojas 2+ idénticas al original (verificable). → cubre FAC-1, FAC-2
3. **Persistencia**: todo se ve en el dashboard. → cubre DSH-1, INF-2

**La app se considera lista para el cliente cuando todos los P0 pasan ✅ con al menos 2 facturas reales distintas.**
