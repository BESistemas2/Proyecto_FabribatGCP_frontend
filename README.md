# Fabribat GCP Frontend

Sistema de Conciliación Bancaria y Automatización ETL - Frontend

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Shadcn UI
- **State/Data:** TanStack Query v5 + Axios
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Notifications:** Sonner

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Dashboard layout con sidebar
│   │   ├── workbench/     # Módulo 1: Workbench Dual
│   │   ├── cargas/        # Módulo 2: Centro Cargas ETL
│   │   ├── actas/         # Módulo 3: Actas Conciliación
│   │   └── cuentas/       # Módulo 4: Catálogo Cuentas
│   ├── layout.tsx         # Root layout con providers
│   └── globals.css        # Estilos globales + Tailwind
├── components/
│   ├── ui/                # Componentes base Shadcn UI
│   ├── layout/            # Sidebar, Header, DashboardLayout
│   ├── workbench/         # Componentes específicos Workbench
│   ├── cargas/            # Componentes Cargas ETL
│   ├── actas/             # Componentes Actas
│   ├── cuentas/           # Componentes Cuentas
│   └── shared/            # Componentes compartidos (MoneyFormat, etc.)
├── lib/
│   ├── api/               # Cliente API + endpoints
│   │   ├── client.ts      # Axios instance con interceptors
│   │   ├── endpoints.ts   # Constantes de endpoints
│   │   ├── bancos.ts      # API módulo bancos
│   │   └── conciliacion.ts # API módulo conciliación
│   ├── hooks/             # React Query hooks
│   │   ├── use-bancos.ts
│   │   └── use-conciliacion.ts
│   ├── providers/         # QueryProvider, ToastProvider
│   ├── utils/             # cn, format, validation
│   └── constants/         # Bancos, reglas, estados
└── types/                 # TypeScript types
    ├── bancos.ts
    ├── conciliacion.ts
    └── index.ts
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
npm run start
```

## Linting & Typecheck

```bash
npm run lint
npm run typecheck
```

## Variables de Entorno

Copiar `.env.example` a `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## API Endpoints Esperados (Backend FastAPI)

### Módulo Bancos (`/bancos`)
- `GET /cuentas` - Lista cuentas bancarias
- `POST /cuentas/sincronizar` - Sincroniza catálogo desde Dynamics 365 BC
- `PUT /cuentas/{id}` - Actualiza switches RPA/Auto-Match
- `POST /cargas/upload` - Subida extractos Excel/CSV
- `GET /cargas` - Historial de cargas
- `GET /movimientos/pendientes?id_cuenta={id}` - Movimientos pendientes

### Módulo Conciliación (`/conciliacion`)
- `GET /mayor-editado?fecha_inicio=&fecha_fin=&cuenta_contable=` - Libro Mayor BC
- `POST /ejecutar?fecha_inicio=&fecha_fin=` - Ejecuta motor de coincidencia
- `GET /actas` - Lista actas generadas
- `GET /actas/{id}` - Detalle acta + partidas en tránsito