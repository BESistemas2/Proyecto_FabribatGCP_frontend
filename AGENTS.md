# AGENTS.md — Frontend Fabribat (Next.js)

Guía para agentes de código (OpenCode u otros). Léela completa antes de cada tarea.

## Qué es este proyecto

Frontend de Baterías Ecuador / Fabribat: conciliación bancaria y, en migración, cobranzas (reemplaza una app de AppSheet).
Next.js 15 (App Router), React 19, TypeScript, Tailwind, componentes Radix en `src/components/ui`, React Query.

- Páginas: `src/app/(dashboard)/<modulo>/page.tsx`. El menú lateral está en `src/app/(dashboard)/layout.tsx`.
- Llamadas al backend: `src/lib/api/<modulo>.ts` usando el cliente de `src/lib/api/client.ts`.
- Hooks de datos: `src/lib/hooks/use-<modulo>.ts` (React Query).
- Tipos: `src/types/<modulo>.ts`, exportados desde `src/types/index.ts`.
- Componentes por módulo: `src/components/<modulo>/`.

## Reglas de seguridad (obligatorias)

- Nunca leas, muestres ni copies `.env`, `.env.local`, `stack.env` ni credenciales.
- No toques autenticación (`middleware.ts`, `lib/api/auth.ts`, `use-auth.tsx`) salvo que la tarea lo pida.
- No uses datos reales de clientes; en ejemplos y pruebas, solo datos inventados.
- No agregues dependencias sin que la tarea lo diga.

## Cómo se trabaja

1. Cada tarea está en `tareas/TNN.md`. Haz solo lo que dice; si algo no está claro, pregunta.
2. Rama `cobranzas/TNN-descripcion-corta` desde `main`.
3. Antes de terminar: `npm run typecheck` y `npm run lint` sin errores.
4. Commits pequeños en español. No hagas push a `main`.
5. Al terminar, resume archivos cambiados, decisiones y pendientes.

## Convenciones

- Textos de la interfaz en español de Ecuador; montos con `$` y dos decimales; fechas `dd/mm/aaaa`.
- Copia el patrón de `conciliacion`: `lib/api/conciliacion.ts`, `lib/hooks/use-conciliacion.ts`, `components/workbench/`.
- Usa los componentes de `src/components/ui` y la paleta corporativa existente; no metas estilos ni librerías nuevas.
- Formularios con react-hook-form + zod, igual que los existentes.
- Pantallas con estados de carga, vacío y error.
- Diseño adaptable: debe usarse en celular.
