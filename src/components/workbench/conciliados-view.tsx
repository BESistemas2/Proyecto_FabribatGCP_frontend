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
import { getReglaConfig } from "@/lib/constants/bancos";
import { sumarMontos } from "@/lib/utils/format";

import type { GrupoConciliado } from "@/types/conciliacion";
export type { GrupoConciliado, MovimientoBCVinculado } from "@/types/conciliacion";

interface ConciliadosViewProps {
  grupos?: GrupoConciliado[];
  isLoading?: boolean;
  onDesconciliar?: (idConciliacion: string) => void;
  /** Reglas desactivadas en el filtro de la leyenda: sus cruces no se muestran. */
  reglasOcultas?: ReadonlySet<string>;
}

// Etiqueta y color de la regla: mismo catálogo que el resto de la app
function getReglaBadge(reglaRaw: string) {
  const c = getReglaConfig(reglaRaw);
  return { label: c.shortLabel, className: c.className };
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
  reglasOcultas,
}: ConciliadosViewProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const gruposPorRegla = (grupos || []).filter((g) => !reglasOcultas?.has(g.regla_aplicada));
  const filtradoPorRegla = gruposPorRegla.length < (grupos || []).length;

  const gruposFiltrados = gruposPorRegla.filter((g) => {
    const term = search.toLowerCase();
    const ref = (g.banco?.referencia || "").toLowerCase();
    const conc = (g.banco?.concepto || "").toLowerCase();
    const matchBC = (g.partidas_bc || []).some(
      (p) =>
        (p.num_documento || "").toLowerCase().includes(term) ||
        (p.external_document_no || "").toLowerCase().includes(term) ||
        (p.concepto || "").toLowerCase().includes(term),
    );
    const matchBanco = (g.movimientos_banco || []).some(
      (m) => (m.referencia || "").toLowerCase().includes(term) || (m.concepto || "").toLowerCase().includes(term),
    ) || (g.referencia_reverso || "").includes(term);
    return ref.includes(term) || conc.includes(term) || matchBC || matchBanco;
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
          Mostrando <strong>{gruposFiltrados.length}</strong>
          {gruposFiltrados.length !== (grupos || []).length && <> de {(grupos || []).length}</>} cruces realizados
        </div>
      </div>

      {/* Lista de Grupos Conciliados */}
      <div className="border rounded-md overflow-hidden bg-card flex-1 overflow-y-auto">
        {gruposFiltrados.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-40 text-muted-foreground" />
            {(grupos || []).length > 0 ? (
              <>
                <p className="text-sm font-medium">Ningún cruce coincide con el filtro</p>
                <p className="text-xs mt-1">
                  {filtradoPorRegla
                    ? "Active más reglas en la leyenda o cambie la búsqueda."
                    : "Pruebe con otro texto de búsqueda."}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">No hay registros conciliados en este período</p>
                <p className="text-xs mt-1">
                  Los movimientos que concilies aparecerán agrupados en esta vista.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {gruposFiltrados.map((grupo) => {
              const isExpanded = !!expandedRows[grupo.id_conciliacion];
              const reglaInfo = getReglaBadge(grupo.regla_aplicada);
              const totalBC = sumarMontos(grupo.partidas_bc || [], (p) => p.monto);
              const movsBanco = grupo.movimientos_banco || [];
              const esReversoBanco = movsBanco.length > 0;

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
                          {formatDateLocal(grupo.banco?.fecha ?? movsBanco[0]?.fecha ?? grupo.partidas_bc?.[0]?.fecha)}
                        </span>
                      </div>

                      <div className="overflow-hidden truncate max-w-xs sm:max-w-md">
                        {grupo.banco ? (
                          <>
                            <span className="font-semibold text-foreground mr-2">
                              {grupo.banco.referencia}
                            </span>
                            <span className="text-muted-foreground truncate">
                              {grupo.banco.concepto}
                            </span>
                          </>
                        ) : esReversoBanco ? (
                          <span className="font-sans text-muted-foreground">
                            REF {grupo.referencia_reverso || movsBanco[0]?.referencia} · pago reversado por el banco (sin asiento en BC)
                          </span>
                        ) : (
                          <span className="font-sans text-muted-foreground">
                            Doc. {grupo.partidas_bc?.[0]?.num_documento} · se anula dentro de BC (sin movimiento bancario)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-sm text-foreground">
                          {grupo.banco ? formatMoneyLocal(grupo.banco.monto) : formatMoneyLocal(0)}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {esReversoBanco
                            ? `${movsBanco.length} movimientos del banco`
                            : `${(grupo.partidas_bc || []).length} ${grupo.partidas_bc?.length === 1 ? "asiento BC" : "asientos BC"}`}
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
                      {esReversoBanco && (
                        <>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-1 border-b">
                            <span>MOVIMIENTOS DEL BANCO QUE SE ANULAN ENTRE SÍ</span>
                            <span>Suma: {formatMoneyLocal(sumarMontos(movsBanco, (m) => m.monto))}</span>
                          </div>
                          <div className="space-y-1.5">
                            {movsBanco.map((m) => (
                              <div key={m.id_movimiento_banco}
                                   className="flex items-center justify-between bg-background p-2 rounded border text-xs font-mono">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <span className="font-bold text-foreground shrink-0">{m.referencia}</span>
                                  <span className="text-muted-foreground truncate">{m.concepto}</span>
                                </div>
                                <span className={cn("font-semibold shrink-0", m.monto < 0 ? "text-destructive" : "text-foreground")}>
                                  {formatMoneyLocal(m.monto)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {!esReversoBanco && (
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-1 border-b">
                        <span>
                          ASIENTOS CONTABLES EN DYNAMICS 365 BC (LIBRO MAYOR)
                        </span>
                        <span>Suma BC: {formatMoneyLocal(totalBC)}</span>
                      </div>
                      )}

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
