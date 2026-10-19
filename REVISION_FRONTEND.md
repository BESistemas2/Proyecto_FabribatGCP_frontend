# Revisión de código — Frontend Fabribat GCP (Next.js 14)

Fecha: 19/10/2026 · Alcance: todo `src/**` excepto `components/ui` (shadcn), más `package.json`, `Dockerfile`, `docker-compose.yml` y `next.config.mjs`.
Comprobaciones: `npm install`, `tsc --noEmit`, `next lint`, `next build` y `npm audit`, todas sobre una copia.

---

## 🔴 Crítico

| # | Problema | Dónde | Solución |
|---|---|---|---|
| C1 | **`next build` falla**: `useSearchParams()` sin `<Suspense>` en `/login`, así que la imagen Docker no se construye | `app/login/page.tsx:33` | Envolver la página en `<Suspense>`. |
| C2 | **`npm ci` falla en Linux/Docker** (EBADPLATFORM) por `"@next/swc-win32-x64-msvc": "^16.3.8"`, que además es la v16 con Next 14 | `package.json:54` | Eliminar la dependencia. |
| C3 | **En producción, el bundle apunta a `localhost:8000`**: el compose define `NEXT_PUBLIC_API_URL`, el código lee `NEXT_PUBLIC_API_BASE_URL`, y las `NEXT_PUBLIC_*` se fijan al compilar | `docker-compose.yml:14` · `lib/api/client.ts:4` · `Dockerfile` | `ARG`/`ENV` en la etapa builder, con el mismo nombre de variable. Pasarlas como `build.args`. |
| C4 | **Bucle de redirecciones tras un 401**: el interceptor borra `localStorage` pero no la cookie, y el middleware manda `/login` de vuelta a `/workbench` | `client.ts:27-34` · `middleware.ts:19-23` | Un helper `clearSession()` que borre también la cookie. No redirigir cuando venga `?expired=1`. |
| C5 | **Open redirect / XSS**: `window.location.replace(searchParams.get("redirect"))` acepta `javascript:` y permite robar el token | `login/page.tsx:46-47,97-98` | Aceptar solo rutas que empiecen por `/` y no por `//`. |
| C6 | **Next 14.1.0 con CVE crítico** (CVE-2025-29927, bypass del middleware con `x-middleware-subrequest`) y otros | `package.json:41` | Actualizar Next (mínimo 14.2.35; `npm audit` pide ≥ 15.5.24). |
| C7 | **Los montos negativos se muestran sin signo** (`signDisplay: "never"`), y `MoneyDiff` muestra `+$+50,00` | `lib/utils/format.ts:28` · `shared/money-format.tsx:40,51` | Usar `"auto"` y quitar el `+` manual. |
| C8 | **Los roles no coinciden**: el modal usa `ADMIN/ANALISTA/TESORERO`, los tipos `ADMIN/BASICO/CONTABILIDAD/RECEPTOR_MAIL`, y `auth.ts` un tercer conjunto. Crear un usuario falla y `ROL_CONFIG[rol]` puede romper la página de admin (tsc lo marca) | `admin/crear-usuario-modal.tsx:46,83` · `types/identity.ts:1` · `lib/api/auth.ts:13` · `admin/usuarios/page.tsx:117,166-176` | Un único `RolUsuario` y un valor de respaldo en el render. |
| C9 | **El Workbench envía y exporta el acta con un id inventado**: `` `acta-${cuenta}-${YYYY-MM}` `` en vez del `id_acta` real | `workbench/page.tsx:124-127` | Guardar `data.id_acta` del auto-match, o buscarlo en `useActas`. |

## 🟠 Importante

- **I1 · Invalidar `bancosKeys.cargas()` no refresca nada**: la clave lleva `undefined`. Solución: una clave raíz `["bancos","cargas"]`. Archivo: `use-bancos.ts:24-25,117`.
- **I2 · El `...options` de las mutaciones anula el `onSuccess` que invalida la caché.** Archivos: `use-bancos.ts`, `use-usuarios.ts`.
- **I3 · "Re-ejecutar Auto-Match" está vacío.** Hay dos instancias de la mutación, así que `isPending` nunca se activa. Archivo: `workbench/page.tsx:78,112-115`.
- **I4 · Subida de extractos.**
  - Hay una carrera en `validateFile` asíncrono.
  - Se puede subir dos veces: el form no se resetea tras el éxito.
  - El archivo se adjunta dos veces (`file` y `archivo`), con lo que una petición se duplica hasta unos 30 MB.
  - La validación de cabeceras nunca se exige.
  - `totalRows` se queda en 34 o menos.
- **I5 · Usuario de auditoría inventado** (`"operador@fabribat.com"`) y enviado por el cliente. El backend debe usar el JWT.
- **I6 · XSS en "Imprimir Resumen"**: `document.write` sin escapar. Archivo: `actas/page.tsx:101-145`.
- **I7 · El token vive en `localStorage` y en una cookie no HttpOnly.** El middleware solo comprueba que la cookie exista.
- **I8 · Cerrar sesión no redirige ni limpia la caché de React Query.** Archivo: `header.tsx:43-50`.
- **I9 · El acceso de admin solo se controla en el cliente.** `useUsuarios()` se dispara antes del chequeo de rol.
- **I10 · Fechas desplazadas por la zona horaria.** `new Date("2026-09-01")` se muestra como 31/08 en Ecuador. Solución: usar `parseLocalDate`, que ya existe en el código.
- **I11 · Sumas de dinero con decimales flotantes.** Si la API devuelve `Decimal` como string, `sum + m.monto` concatena texto. Solución: sumar en centavos.
- **I12 · Los KPIs del Workbench mezclan universos**: los pendientes de banco no se filtran por periodo y los del libro sí.
- **I13 · `client.ts` descarta `status` y `response` del error**, así que los mensajes de error se pierden. `getConciliados` oculta los 500 y devuelve `[]`.
- **I14 · Si la búsqueda no da resultados, el buscador desaparece** (en `actas-grid` y `cuentas-grid`).
- **I15 · `partidas-transito-drawer`.**
  - Las columnas ERP están mal mapeadas.
  - El fetch no se cancela.
  - El botón "Exportar PDF" descarga un Excel.
- **I16 · La interfaz muestra datos inventados.**
  - `?? 1136` registros y el banco `"GUAYAQUIL"`.
  - "Descarga iniciada" sin descargar nada.
  - `getBancoConfig` devuelve Pichincha por defecto.
  - `total_conciliado` es un monto, pero se presenta como cantidad.
- **I17 · Los KPIs y filtros de cargas se calculan solo sobre la página actual** (10 registros).
- **I18 · `xlsx` 0.18.5 vulnerable** (CVE-2023-30533, CVE-2024-22363). Pasar a SheetJS 0.20.x desde su CDN, o a exceljs.
- **I19 · Dockerfile.** `node:18` está fuera de soporte y usa la sintaxis antigua `ENV X Y`. Además copia `public/`, que no existe en el proyecto.

## 🟢 Mejora

- **Bundle.** `/cargas` pesa 128 kB propios por `xlsx`. Solución: `await import("xlsx")` dinámico.
- **Componentes grandes a dividir:** `cargas/page.tsx`, `cargas-history-table`, `dropzone-uploader` y `cuenta-config-drawer`. Este último tiene el bloque RPA y el de Auto-Match casi idénticos.
- **Listas grandes sin virtualizar:** `SplitView` y `ConciliadosView`. Solución: `@tanstack/react-virtual`.
- **Falta `useMemo`** en totales y filtros. El `value` del `AuthContext` tampoco está memoizado.
- **Código duplicado.**
  - Hay dos `EnviarReporteModal`, en `actas/` y en `workbench/`. Unificarlos.
  - Hay 4 formateadores de dinero distintos: es-EC, en-US y dos locales.
  - `parseLocalDate` está duplicado, y los KPIs de cuentas también.
- **Código muerto.**
  - `endpoints.ts`, `setAuthToken`, `useActaDetalle`, `ActasList`, el rewrite `/api-proxy` y el switch "Cuenta Activa" (que no se envía).
  - En `package.json`, `@react-oauth/google` y los scripts de prisma.
- **Calidad.**
  - 26 usos de `any`.
  - `key={Math.random()}`.
  - 5 dropdowns hechos a mano, sin teclado ni ARIA.
  - Faltan cabeceras CSP y HSTS en `next.config.mjs`.

## Resultados de las herramientas

- **tsc:** 2 errores reales, ambos de roles (C8). Los otros 29 vienen de stubs de UI que se usaron solo para la prueba.
- **lint:** falta `fetchDetalle` en las dependencias del `useEffect` de `partidas-transito-drawer:51`; hay un `<img>` en `cuenta-card:72`. No hay `.eslintrc`.
- **npm audit:** 1 crítico (`next`), 7 altos (`xlsx`, `postcss`/`tailwind`) y 3 moderados.
