"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Unlink,
  CheckCircle2,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export interface MovimientoBCVinculado {
  id_movimiento_bc: string;
  num_documento: string;
  external_document_no?: string;
  fecha: string;
  concepto: string;
  monto: number;
  cuenta_contable: string;
}

export interface GrupoConciliado {
  id_conciliacion: string;
  fecha_conciliacion: string;
  regla_aplicada: string;
  creado_por: string;
  banco: {
    id_movimiento_banco: string;
    fecha: string;
    concepto: string;
    referencia: string;
    monto: number;
    tipo: "CREDITO" | "DEBITO" | string;
  };
  partidas_bc: MovimientoBCVinculado[];
}

interface ConciliadosViewProps {
  grupos?: GrupoConciliado[];
  isLoading?: boolean;
  onDesconciliar?: (idConciliacion: string) => void;
}

// Mapeo flexible de reglas de cruce para evitar la caída en "Manual"
function getReglaBadge(reglaRaw: string) {
  const r = (reglaRaw || "").toUpperCase();

  if (r.includes("CONSOLIDADO") || r.includes("1_N") || r.includes("1:N")) {
    return {
      label: "Consolidado 1:N",
      className:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
    };
  }
  if (
    r.includes("EXACTA") ||
    r.includes("EXACTO") ||
    r.includes("1_1") ||
    r.includes("1:1")
  ) {
    return {
      label: "Exacto 1:1",
      className:
        "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300",
    };
  }
  if (
    r.includes("PARCIAL") ||
    r.includes("MONTO") ||
    r.includes("FECHA") ||
    r.includes("REGLA_2")
  ) {
    return {
      label: "Monto + Fecha",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
    };
  }
  if (
    r.includes("SUBCONJUNTO") ||
    r.includes("COMBINATORIO") ||
    r.includes("SUBSET") ||
    r.includes("REGLA_4")
  ) {
    return {
      label: "Subset Sum",
      className:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300",
    };
  }

  return {
    label: "Manual",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300",
  };
}

function formatMoneyLocal(amount: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

// Formateador sin sesgo de zona horaria (evita desfasar fechas UTC a Ecuador)
function formatDateLocal(dateString: string): string {
  if (!dateString) return "—";
  try {
    // Extrae la fecha ignorando tiempo u horas de cualquier string
    const cleanDate = dateString.split("T")[0].split(" ")[0];
    const parts = cleanDate.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export function ConciliadosView({
  grupos = [],
  isLoading = false,
  onDesconciliar,
}: ConciliadosViewProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const gruposFiltrados = (grupos || []).filter((g) => {
    const term = search.toLowerCase();
    const ref = (g.banco?.referencia || "").toLowerCase();
    const conc = (g.banco?.concepto || "").toLowerCase();
    const matchBC = (g.partidas_bc || []).some(
      (p) =>
        (p.num_documento || "").toLowerCase().includes(term) ||
        (p.external_document_no || "").toLowerCase().includes(term) ||
        (p.concepto || "").toLowerCase().includes(term),
    );
    return ref.includes(term) || conc.includes(term) || matchBC;
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Cargando registros conciliados...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Buscador de Conciliados */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por referencia bancaria, N° documento, N° doc externo o concepto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          Mostrando <strong>{gruposFiltrados.length}</strong> cruces realizados
        </div>
      </div>

      {/* Lista de Grupos Conciliados */}
      <div className="border rounded-md overflow-hidden bg-card flex-1 overflow-y-auto">
        {gruposFiltrados.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-40 text-muted-foreground" />
            <p className="text-sm font-medium">
              No hay registros conciliados en este período
            </p>
            <p className="text-xs mt-1">
              Los movimientos que concilies aparecerán agrupados en esta vista.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {gruposFiltrados.map((grupo) => {
              const isExpanded = !!expandedRows[grupo.id_conciliacion];
              const reglaInfo = getReglaBadge(grupo.regla_aplicada);
              const totalBC = (grupo.partidas_bc || []).reduce(
                (sum, p) => sum + (p.monto || 0),
                0,
              );

              return (
                <div key={grupo.id_conciliacion} className="transition-colors">
                  {/* Fila Principal: MOVIMIENTO BANCARIO */}
                  <div
                    onClick={() => toggleRow(grupo.id_conciliacion)}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 text-xs font-mono",
                      isExpanded && "bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 font-sans border",
                            reglaInfo.className,
                          )}
                        >
                          {reglaInfo.label}
                        </Badge>
                        <span className="text-muted-foreground">
                          {formatDateLocal(grupo.banco?.fecha)}
                        </span>
                      </div>

                      <div className="overflow-hidden truncate max-w-xs sm:max-w-md">
                        <span className="font-semibold text-foreground mr-2">
                          {grupo.banco?.referencia}
                        </span>
                        <span className="text-muted-foreground truncate">
                          {grupo.banco?.concepto}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-sm text-foreground">
                          {formatMoneyLocal(grupo.banco?.monto)}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {(grupo.partidas_bc || []).length}{" "}
                          {grupo.partidas_bc?.length === 1
                            ? "asiento BC"
                            : "asientos BC"}
                        </p>
                      </div>

                      {onDesconciliar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDesconciliar(grupo.id_conciliacion);
                          }}
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                          title="Revertir conciliación"
                        >
                          <Unlink className="h-3.5 w-3.5" />
                          Desconciliar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Fila Desplegable: PARTIDAS VINCULADAS D365 BC */}
                  {isExpanded && (
                    <div className="bg-muted/20 border-t border-b p-3 pl-12 space-y-2 animate-in fade-in-50">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-1 border-b">
                        <span>
                          ASIENTOS CONTABLES EN DYNAMICS 365 BC (LIBRO MAYOR)
                        </span>
                        <span>Suma BC: {formatMoneyLocal(totalBC)}</span>
                      </div>

                      <div className="space-y-1.5">
                        {(grupo.partidas_bc || []).map((partida) => (
                          <div
                            key={partida.id_movimiento_bc}
                            className="flex items-center justify-between bg-background p-2 rounded border text-xs font-mono"
                          >
                            <div className="flex items-center gap-3 overflow-hidden flex-wrap sm:flex-nowrap">
                              <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-bold text-foreground shrink-0">
                                Doc: {partida.num_documento}
                              </span>

                              {/* Renderizado destacado del Documento Externo */}
                              {partida.external_document_no && (
                                <span className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  Ext: {partida.external_document_no}
                                </span>
                              )}

                              <span className="text-muted-foreground shrink-0">
                                {formatDateLocal(partida.fecha)}
                              </span>
                              <span className="text-muted-foreground truncate max-w-xs">
                                {partida.concepto}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <Badge variant="outline" className="text-[10px]">
                                CC: {partida.cuenta_contable}
                              </Badge>
                              <span className="font-semibold text-foreground">
                                {formatMoneyLocal(partida.monto)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                        <span>
                          Conciliado el{" "}
                          <b>{formatDateLocal(grupo.fecha_conciliacion)}</b>
                        </span>
                        <span>
                          Operador: <b>{grupo.creado_por || "Sistema"}</b>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
