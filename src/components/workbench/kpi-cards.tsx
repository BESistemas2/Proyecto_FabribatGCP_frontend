"use client";

import { MoneyFormat, MoneyDiff } from "@/components/shared/money-format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { UploadCloud } from "lucide-react";

export interface KPICardsProps {
  saldoBanco: number | null;
  saldoLibros: number | null;
  tieneExtractoCargado?: boolean;
  isLoading?: boolean;
  /** Nº de partidas pendientes de cada lado (banco / BC) */
  pendientesBanco?: number;
  pendientesErp?: number;
}

export function KPICards({
  saldoBanco,
  saldoLibros,
  tieneExtractoCargado = true,
  isLoading,
  pendientesBanco = 0,
  pendientesErp = 0,
}: KPICardsProps) {
  const diferencia =
    tieneExtractoCargado && saldoBanco !== null && saldoLibros !== null
      ? saldoBanco - saldoLibros
      : null;

  // Conciliado = no queda nada pendiente de cruzar en ninguno de los dos lados
  const isCuadrado = diferencia !== null && pendientesBanco + pendientesErp === 0;

  let estadoLabel = `${pendientesBanco + pendientesErp} PENDIENTES`;
  let estadoClass =
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300";
  let estadoIcon = "⚠";

  if (!tieneExtractoCargado) {
    estadoLabel = "PENDIENTE DE CARGA";
    estadoClass =
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
    estadoIcon = "⚠";
  } else if (isCuadrado) {
    estadoLabel = "CONCILIADO";
    estadoClass =
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300";
    estadoIcon = "✓";
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Saldo Banco */}
      <Card className="kpi-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pendiente banco ({pendientesBanco})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tieneExtractoCargado ? (
            <MoneyFormat
              value={saldoBanco}
              className="text-2xl font-bold tabular-nums"
              zeroAsDash
            />
          ) : (
            <div className="text-2xl font-bold font-mono text-muted-foreground">
              —
            </div>
          )}
          {!tieneExtractoCargado && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <UploadCloud className="h-3 w-3" />
              Sin extracto cargado
            </p>
          )}
          {isLoading && (
            <div className="mt-2 h-2 w-3/4 animate-pulse bg-muted" />
          )}
        </CardContent>
      </Card>

      {/* 2. Saldo Libros BC */}
      <Card className="kpi-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pendiente libros BC ({pendientesErp})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MoneyFormat
            value={saldoLibros}
            className="text-2xl font-bold tabular-nums"
            zeroAsDash
          />
          {isLoading && (
            <div className="mt-2 h-2 w-3/4 animate-pulse bg-muted" />
          )}
        </CardContent>
      </Card>

      {/* 3. Diferencia */}
      <Card className="kpi-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Diferencia (banco - libros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tieneExtractoCargado ? (
            <MoneyDiff
              actual={saldoBanco}
              expected={saldoLibros}
              className="text-2xl font-bold tabular-nums"
            />
          ) : (
            <div className="text-2xl font-bold font-mono text-muted-foreground">
              —
            </div>
          )}
          {isLoading && (
            <div className="mt-2 h-2 w-3/4 animate-pulse bg-muted" />
          )}
        </CardContent>
      </Card>

      {/* 4. Estado Conciliación */}
      <Card className="kpi-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Estado Conciliación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={cn(
                "text-xs sm:text-sm px-3 py-1.5 font-semibold",
                estadoClass,
              )}
            >
              {estadoLabel}
            </Badge>
            {!isLoading && (
              <span
                className={cn(
                  "text-sm font-mono tabular-nums",
                  !tieneExtractoCargado
                    ? "text-amber-600 dark:text-amber-400"
                    : isCuadrado
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                )}
              >
                {estadoIcon}
              </span>
            )}
          </div>
          {isLoading && (
            <div className="mt-2 h-2 w-1/4 animate-pulse bg-muted" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function KPICardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="kpi-card">
          <CardHeader className="pb-2">
            <div className="h-4 w-24 animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-3/4 animate-pulse bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
