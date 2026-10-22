"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Search, RotateCcw, ChevronDown, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import {
  ResultadoConciliacionResponse,
  EstadoActa,
} from "@/types/conciliacion";
import { ActaCard, ActaCardSkeleton } from "./acta-card";
import { EnviarReporteModal } from "@/components/actas/enviar-reporte-modal";
import { useAuth } from "@/lib/hooks/use-auth";

interface ActasGridProps {
  actas: ResultadoConciliacionResponse[];
  isLoading?: boolean;
  onViewTransito: (acta: ResultadoConciliacionResponse) => void;
  onDownload?: (acta: ResultadoConciliacionResponse) => void;
  onRefresh?: () => void;
  emptyMessage?: string;
}

const ESTADO_OPTIONS = [
  { value: "ALL", label: "Todos los estados" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "CERRADO", label: "Cerrado" },
  { value: "APROBADO", label: "Aprobado" },
] as const;

const SORT_OPTIONS = [
  { value: "fecha_desc", label: "Más recientes primero" },
  { value: "fecha_asc", label: "Más antiguas primero" },
  { value: "saldo_desc", label: "Mayor saldo banco" },
  { value: "saldo_asc", label: "Menor saldo banco" },
  { value: "conciliado_desc", label: "Mayor conciliado" },
  { value: "conciliado_asc", label: "Menor conciliado" },
] as const;

function parsePeriodo(periodo: string): Date {
  if (!periodo) return new Date(0);
  const [anio, mes] = periodo.split("-").map(Number);
  if (!anio || !mes) return new Date(0);
  return new Date(anio, mes - 1, 1);
}

function getFechaSortValue(acta: ResultadoConciliacionResponse): number {
  if (acta.created_at) return new Date(acta.created_at).getTime();
  if (acta.periodo) return parsePeriodo(acta.periodo).getTime();
  return 0;
}

export function ActasGrid({
  actas,
  isLoading = false,
  onViewTransito,
  onDownload,
  onRefresh,
  emptyMessage = "No se encontraron actas de conciliación",
}: ActasGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"ALL" | EstadoActa>("ALL");
  const [sortBy, setSortBy] =
    useState<(typeof SORT_OPTIONS)[number]["value"]>("fecha_desc");
  const [openEstado, setOpenEstado] = useState(false);
  const [openSort, setOpenSort] = useState(false);

  // Estado para controlar qué acta se va a enviar por correo
  const [actaParaEnviar, setActaParaEnviar] = useState<string | null>(null);
  const { puedeOperar } = useAuth();

  const estadoRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        estadoRef.current &&
        !estadoRef.current.contains(event.target as Node)
      ) {
        setOpenEstado(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setOpenSort(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredActas = useMemo(() => {
    let result = [...actas];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (acta) =>
          (acta.cuenta_contable || "").toLowerCase().includes(term) ||
          (acta.periodo || "").toLowerCase().includes(term) ||
          (acta.creado_por || "").toLowerCase().includes(term),
      );
    }

    if (estadoFilter !== "ALL") {
      result = result.filter((acta) => acta.estado === estadoFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "fecha_asc":
          return getFechaSortValue(a) - getFechaSortValue(b);
        case "fecha_desc":
          return getFechaSortValue(b) - getFechaSortValue(a);
        case "saldo_asc":
          return Number(a.saldo_banco) - Number(b.saldo_banco);
        case "saldo_desc":
          return Number(b.saldo_banco) - Number(a.saldo_banco);
        case "conciliado_asc":
          return Number(a.total_conciliado) - Number(b.total_conciliado);
        case "conciliado_desc":
          return Number(b.total_conciliado) - Number(a.total_conciliado);
        default:
          return 0;
      }
    });

    return result;
  }, [actas, searchTerm, estadoFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <ActaCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filteredActas.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Skeleton className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {searchTerm || estadoFilter !== "ALL"
              ? "Intente ajustar los filtros de búsqueda"
              : "Ejecute un Auto-Match desde el Workbench para generar actas"}
          </p>
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh} className="w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Actas de Conciliación
              <Badge variant="secondary" className="ml-2">
                {filteredActas.length} de {actas.length}
              </Badge>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por banco, cuenta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4"
                />
              </div>
              <div ref={estadoRef} className="relative w-full sm:w-[160px]">
                <button
                  type="button"
                  onClick={() => setOpenEstado(!openEstado)}
                  disabled={isLoading}
                  className="flex w-full h-10 items-center justify-between rounded-md text-left border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="truncate">
                    {ESTADO_OPTIONS.find((o) => o.value === estadoFilter)
                      ?.label || "Filtrar estado"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "ml-2 h-4 w-4 shrink-0 opacity-50",
                      openEstado && "rotate-180",
                    )}
                  />
                </button>
                {openEstado && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-full max-h-[280px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
                    {ESTADO_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setEstadoFilter(opt.value as "ALL" | EstadoActa);
                          setOpenEstado(false);
                        }}
                        className={cn(
                          "w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm flex justify-between items-center",
                          estadoFilter === opt.value &&
                            "bg-accent/80 font-medium",
                        )}
                        role="option"
                        aria-selected={estadoFilter === opt.value}
                      >
                        {opt.label}
                        {estadoFilter === opt.value && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div ref={sortRef} className="relative w-full sm:w-[180px]">
                <button
                  type="button"
                  onClick={() => setOpenSort(!openSort)}
                  disabled={isLoading}
                  className="flex w-full h-10 items-center justify-between rounded-md text-left border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="truncate">
                    {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ||
                      "Ordenar"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "ml-2 h-4 w-4 shrink-0 opacity-50",
                      openSort && "rotate-180",
                    )}
                  />
                </button>
                {openSort && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-full max-h-[280px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.value);
                          setOpenSort(false);
                        }}
                        className={cn(
                          "w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm flex justify-between items-center",
                          sortBy === opt.value && "bg-accent/80 font-medium",
                        )}
                        role="option"
                        aria-selected={sortBy === opt.value}
                      >
                        {opt.label}
                        {sortBy === opt.value && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RotateCcw
                    className={cn("h-4 w-4", isLoading && "animate-spin")}
                  />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredActas.map((acta) => (
          <ActaCard
            key={acta.id_acta}
            acta={acta}
            onViewTransito={onViewTransito}
            onDownload={onDownload}
            onSendEmail={puedeOperar ? () => setActaParaEnviar(acta.id_acta) : undefined}
          />
        ))}
      </div>

      {/* Modal de Envío de Reporte Múltiple */}
      {actaParaEnviar && (
        <EnviarReporteModal
          idActa={actaParaEnviar}
          open={!!actaParaEnviar}
          onOpenChange={(abierto) => {
            if (!abierto) setActaParaEnviar(null);
          }}
        />
      )}
    </div>
  );
}
