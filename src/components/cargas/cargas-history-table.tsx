"use client";
import { parseFecha } from "@/lib/utils/format";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Search,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  FileText,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatRelativeTime } from "@/lib/utils/format";
import { CargaExtracto, EstadoCarga } from "@/types/bancos";
import { ESTADO_CARGA_CONFIG } from "@/lib/constants/bancos";

interface CargasHistoryTableProps {
  cargas: CargaExtracto[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onRefresh?: () => void;
  onViewDetails?: (carga: CargaExtracto) => void;
  onDownload?: (carga: CargaExtracto) => void;
  emptyMessage?: string;
}

const ESTADO_OPTIONS: { value: EstadoCarga | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos los estados" },
  { value: "COMPLETADO", label: "Completado" },
  { value: "ERROR", label: "Error" },
  { value: "PROCESANDO", label: "Procesando" },
  { value: "PENDIENTE", label: "Pendiente" },
];

const LIMIT_OPTIONS = [
  { value: "10", label: "10 por página" },
  { value: "25", label: "25 por página" },
  { value: "50", label: "50 por página" },
  { value: "100", label: "100 por página" },
] as const;

function resolveBancoNombre(carga: any): string {
  if (carga.banco_nombre && carga.banco_nombre !== "Banco")
    return carga.banco_nombre;
  if (carga.banco && carga.banco !== "Banco") return carga.banco;
  if (carga.banco_detectado) return carga.banco_detectado;

  const filename = (carga.nombre_archivo || carga.filename || "").toUpperCase();
  if (filename.includes("GUAYAQUIL")) return "BANCO GUAYAQUIL";
  if (filename.includes("PICHINCHA")) return "BANCO PICHINCHA";
  if (filename.includes("PACIFICO") || filename.includes("PACÍFICO"))
    return "BANCO PACIFICO";
  if (filename.includes("PRODUBANCO")) return "PRODUBANCO";

  return carga.alias_cuenta || "Banco";
}

function parseFechaNormalizada(fechaRaw: any): Date | null {
  return parseFecha(fechaRaw);
}

export function CargasHistoryTable({
  cargas = [],
  isLoading = false,
  total,
  page = 1,
  limit = 10,
  onPageChange,
  onLimitChange,
  onRefresh,
  onViewDetails,
  onDownload,
  emptyMessage = "No se encontraron cargas de extractos",
}: CargasHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoCarga | "ALL">("ALL");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CargaExtracto;
    direction: "asc" | "desc";
  }>({
    key: "fecha_carga",
    direction: "desc",
  });
  const [openEstado, setOpenEstado] = useState(false);
  const [openLimit, setOpenLimit] = useState(false);
  const estadoRef = useRef<HTMLDivElement>(null);
  const limitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        estadoRef.current &&
        !estadoRef.current.contains(event.target as Node)
      ) {
        setOpenEstado(false);
      }
      if (
        limitRef.current &&
        !limitRef.current.contains(event.target as Node)
      ) {
        setOpenLimit(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCargas = useMemo(() => {
    if (!Array.isArray(cargas)) return [];

    return cargas.filter((carga) => {
      const nombreArchivo = (
        carga.nombre_archivo ||
        (carga as any).filename ||
        ""
      ).toLowerCase();
      const bancoNombre = resolveBancoNombre(carga).toLowerCase();
      const aliasCuenta = (
        carga.alias_cuenta ||
        (carga as any).numero_cuenta ||
        ""
      ).toLowerCase();
      const creadoPor = (
        carga.creado_por ||
        carga.created_by ||
        ""
      ).toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        searchTerm === "" ||
        nombreArchivo.includes(searchLower) ||
        bancoNombre.includes(searchLower) ||
        aliasCuenta.includes(searchLower) ||
        creadoPor.includes(searchLower);

      const estadoNormalizado = (carga.estado || "COMPLETADO").toUpperCase();
      const matchesEstado =
        estadoFilter === "ALL" || estadoNormalizado === estadoFilter;

      return matchesSearch && matchesEstado;
    });
  }, [cargas, searchTerm, estadoFilter]);

  const sortedCargas = useMemo(() => {
    return [...filteredCargas].sort((a, b) => {
      const aVal =
        a[sortConfig.key] ??
        (a as any)[sortConfig.key === "fecha_carga" ? "created_at" : ""];
      const bVal =
        b[sortConfig.key] ??
        (b as any)[sortConfig.key === "fecha_carga" ? "created_at" : ""];

      const direction = sortConfig.direction === "asc" ? 1 : -1;

      if (sortConfig.key === "fecha_carga") {
        const dateA = parseFechaNormalizada(aVal)?.getTime() ?? 0;
        const dateB = parseFechaNormalizada(bVal)?.getTime() ?? 0;
        return (dateA - dateB) * direction;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * direction;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * direction;
      }
      return 0;
    });
  }, [filteredCargas, sortConfig]);

  const handleSort = (key: keyof CargaExtracto) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: keyof CargaExtracto) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Registros</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  const totalItems = total ?? sortedCargas.length;
  const totalPages = totalItems ? Math.ceil(totalItems / limit) : 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Cargas
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalItems} total
              </Badge>
            )}
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar archivo, banco, cuenta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4"
              />
            </div>
            <div ref={estadoRef} className="relative w-full sm:w-[180px]">
              <button
                type="button"
                onClick={() => setOpenEstado(!openEstado)}
                className="w-full h-10 truncate justify-between text-left border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center"
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
                <div className="absolute top-full left-0 mt-2 z-50 w-full max-h-[280px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
                  {ESTADO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setEstadoFilter(opt.value as EstadoCarga | "ALL");
                        setOpenEstado(false);
                      }}
                      className={cn(
                        "w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm flex items-center justify-between",
                        estadoFilter === opt.value &&
                          "bg-accent/80 font-medium",
                      )}
                    >
                      <span>{opt.label}</span>
                      {estadoFilter === opt.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
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
                <Loader2
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {sortedCargas.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">{emptyMessage}</h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm || estadoFilter !== "ALL"
                ? "Intente ajustar los filtros de búsqueda"
                : "Suba su primer extracto bancario desde el formulario"}
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSort("nombre_archivo")}
                    >
                      <div className="flex items-center gap-1">
                        Archivo {getSortIcon("nombre_archivo")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSort("banco_nombre")}
                    >
                      <div className="flex items-center gap-1">
                        Banco {getSortIcon("banco_nombre")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSort("fecha_carga")}
                    >
                      <div className="flex items-center gap-1">
                        Fecha {getSortIcon("fecha_carga")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-accent"
                      onClick={() => handleSort("registros_importados")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Registros {getSortIcon("registros_importados")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSort("estado")}
                    >
                      Estado {getSortIcon("estado")}
                    </TableHead>
                    <TableHead className="w-32">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCargas.map((carga) => {
                    const estadoKey = (
                      carga.estado || "COMPLETADO"
                    ).toUpperCase() as EstadoCarga;
                    const estadoConfig = ESTADO_CARGA_CONFIG[estadoKey] || {
                      label: estadoKey,
                      variant: "default",
                      className:
                        "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
                    };

                    const nombreArchivo =
                      carga.nombre_archivo ||
                      (carga as any).filename ||
                      "Extracto.xlsx";
                    const aliasCuenta =
                      carga.alias_cuenta || (carga as any).numero_cuenta || "";
                    const bancoNombre = resolveBancoNombre(carga);
                    const fechaObj = parseFechaNormalizada(
                      carga.fecha_carga || (carga as any).created_at,
                    );

                    const regImportados =
                      carga.registros_importados ??
                      (carga as any).registros_procesados ??
                      (carga as any).registros_insertados ??
                      0;
                    const regError = carga.registros_con_error ?? 0;

                    return (
                      <TableRow
                        key={carga.id_carga}
                        className="hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="overflow-hidden">
                              <p className="font-medium truncate max-w-[250px]">
                                {nombreArchivo}
                              </p>
                              {aliasCuenta && (
                                <p className="text-xs text-muted-foreground">
                                  {aliasCuenta}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {bancoNombre}
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {fechaObj ? (
                            <>
                              {formatDate(fechaObj)}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({formatRelativeTime(fechaObj)})
                              </span>
                            </>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          <div className="space-y-0.5">
                            <span>{regImportados.toLocaleString()} OK</span>
                            {regError > 0 && (
                              <span className="block text-red-600 dark:text-red-400 text-xs">
                                {regError} errores
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={estadoConfig.variant as any}
                            className={cn(estadoConfig.className, "gap-1")}
                          >
                            {estadoKey === "PROCESANDO" && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {estadoKey === "COMPLETADO" && (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {estadoKey === "ERROR" && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {estadoKey === "PENDIENTE" && (
                              <Clock className="h-3 w-3" />
                            )}
                            {estadoConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {onViewDetails && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onViewDetails(carga)}
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {onDownload &&
                              (estadoKey === "COMPLETADO" || !carga.estado) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onDownload(carga)}
                                  title="Descargar reporte"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            {carga.error_detalle && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                                title={carga.error_detalle}
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            {totalItems > limit && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(page - 1) * limit + 1} a{" "}
                  {Math.min(page * limit, totalItems)} de {totalItems}{" "}
                  resultados
                </div>
                <div className="flex items-center gap-2">
                  <div ref={limitRef} className="relative w-[100px]">
                    <button
                      type="button"
                      onClick={() => setOpenLimit(!openLimit)}
                      className="w-full h-10 truncate justify-between text-left border border-input bg-background px-3 py-2 text-sm flex items-center"
                    >
                      <span className="truncate">
                        {LIMIT_OPTIONS.find((o) => o.value === limit.toString())
                          ?.label || limit.toString()}
                      </span>
                      <ChevronDown
                        className={cn(
                          "ml-2 h-4 w-4 shrink-0 opacity-50",
                          openLimit && "rotate-180",
                        )}
                      />
                    </button>
                    {openLimit && (
                      <div className="absolute top-full left-0 mt-2 z-50 w-full max-h-[280px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
                        {LIMIT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              onLimitChange?.(parseInt(opt.value));
                              setOpenLimit(false);
                            }}
                            className={cn(
                              "w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm",
                              limit.toString() === opt.value &&
                                "bg-accent/80 font-medium",
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(page - 1)}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
