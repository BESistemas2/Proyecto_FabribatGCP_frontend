"use client";

import { MoneyFormat } from "@/components/shared/money-format";
import { RuleBadge } from "./rule-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MovimientoBancoPendiente } from "@/types/bancos";
import { MovimientoErp } from "@/types";
import { TIPO_MOVIMIENTO_CONFIG } from "@/lib/constants/bancos";
import { cn } from "@/lib/utils/cn";

interface BankMovementsTableProps {
  movements: MovimientoBancoPendiente[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function BankMovementsTable({
  movements,
  isLoading = false,
  emptyMessage = "No hay movimientos pendientes en el extracto bancario",
}: BankMovementsTableProps) {
  if (isLoading) {
    return (
      <ScrollArea className="h-[min(62vh,520px)] min-h-[280px] w-full">
        <Table className="min-w-[550px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 px-2">Fecha</TableHead>
              <TableHead className="w-28 px-2">Referencia</TableHead>
              <TableHead className="px-2">Concepto</TableHead>
              <TableHead className="w-24 px-2 text-right">Monto</TableHead>
              <TableHead className="w-20 px-2">Tipo</TableHead>
              <TableHead className="w-28 px-2">Regla</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell className="px-2">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="px-2">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="px-2">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="px-2 text-right">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="px-2">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="px-2">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  if (movements.length === 0) {
    return (
      <ScrollArea className="h-[min(62vh,520px)] min-h-[280px] w-full">
        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
          <Skeleton className="h-12 w-12 rounded-full mb-4" />
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[min(62vh,520px)] min-h-[280px] w-full">
      <Table className="min-w-[580px]">
        <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
          <TableRow>
            <TableHead className="w-20 px-2 text-xs">Fecha</TableHead>
            <TableHead className="w-28 px-2 text-xs">Referencia</TableHead>
            <TableHead className="px-2 text-xs">Concepto</TableHead>
            <TableHead className="w-24 px-2 text-right text-xs">
              Monto
            </TableHead>
            <TableHead className="w-20 px-2 text-xs">Tipo</TableHead>
            <TableHead className="w-28 px-2 text-xs">Regla</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((mov: any) => {
            const fechaStr = mov.fecha_transaccion || mov.fecha;
            const refStr = mov.numero_referencia || mov.referencia;
            const conceptoStr = mov.concepto || mov.descripcion;

            return (
              <TableRow
                key={mov.id_movimiento || mov.id}
                className="hover:bg-muted/50"
              >
                <TableCell className="font-mono text-xs px-2 whitespace-nowrap">
                  {fechaStr ? String(fechaStr).split("T")?.[0] : "—"}
                </TableCell>
                <TableCell
                  className="font-mono text-xs px-2 truncate max-w-[110px]"
                  title={refStr || ""}
                >
                  {refStr || "—"}
                </TableCell>
                <TableCell
                  className="text-xs px-2 max-w-[150px] truncate"
                  title={conceptoStr || ""}
                >
                  {conceptoStr || "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-xs px-2 tabular-nums">
                  <MoneyFormat value={mov.monto} />
                </TableCell>
                <TableCell className="px-2">
                  {mov.tipo_movimiento && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        TIPO_MOVIMIENTO_CONFIG[
                          mov.tipo_movimiento as keyof typeof TIPO_MOVIMIENTO_CONFIG
                        ]?.bgColor ?? "bg-gray-100 dark:bg-gray-800/30",
                        "text-[10px] px-1.5 py-0",
                      )}
                    >
                      {TIPO_MOVIMIENTO_CONFIG[
                        mov.tipo_movimiento as keyof typeof TIPO_MOVIMIENTO_CONFIG
                      ]?.label ?? mov.tipo_movimiento}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="px-2">
                  {mov.regla_cruce && (
                    <RuleBadge regla={mov.regla_cruce} variant="compact" />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

interface ErpMovementsTableProps {
  movements: MovimientoErp[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ErpMovementsTable({
  movements,
  isLoading = false,
  emptyMessage = "No hay movimientos en el Libro Mayor para el período seleccionado",
}: ErpMovementsTableProps) {
  if (isLoading) {
    return (
      <ScrollArea className="h-[min(62vh,520px)] min-h-[280px] w-full">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 px-2">Fecha</TableHead>
              <TableHead className="w-32 px-2">Documento</TableHead>
              <TableHead className="px-2">Descripción</TableHead>
              <TableHead className="w-24 px-2 text-right">Monto</TableHead>
              <TableHead className="w-28 px-2">Regla</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell className="px-2">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="px-2">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="px-2">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="px-2 text-right">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="px-2">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  if (movements.length === 0) {
    return (
      <ScrollArea className="h-[min(62vh,520px)] min-h-[280px] w-full">
        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
          <Skeleton className="h-12 w-12 rounded-full mb-4" />
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[min(62vh,520px)] min-h-[280px] w-full">
      <Table className="min-w-[560px]">
        <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
          <TableRow>
            <TableHead className="w-20 px-2 text-xs">Fecha</TableHead>
            <TableHead className="w-32 px-2 text-xs">Documento</TableHead>
            <TableHead className="px-2 text-xs">Descripción</TableHead>
            <TableHead className="w-24 px-2 text-right text-xs">
              Monto
            </TableHead>
            <TableHead className="w-24 px-2 text-xs">Regla</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((mov: any, idx: number) => {
            // Lectura adaptable para cubrir todas las respuestas de la API
            const fechaVal = mov.posting_date || mov.fecha;
            const entryNoVal =
              mov.entry_no_bc ||
              mov.entry_no ||
              (typeof mov.id === "number" ? mov.id : null);
            const docNoVal = mov.document_no || mov.num_documento;
            const extDocVal = mov.external_document_no || mov.referencia;
            const descVal = mov.description || mov.concepto;
            const keyVal =
              mov.id_movimiento_erp || mov.id || mov.entry_no_bc || idx;
            const detalleDoc = [
              docNoVal && `Doc.: ${docNoVal}`,
              extDocVal && `Doc. externo: ${extDocVal}`,
              entryNoVal != null && `Entry No.: ${entryNoVal}`,
            ].filter(Boolean).join("\n");

            return (
              <TableRow key={keyVal} className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs px-2 whitespace-nowrap">
                  {fechaVal ? String(fechaVal).split("T")[0] : "—"}
                </TableCell>
                <TableCell className="px-2 max-w-[140px]" title={detalleDoc}>
                  <p className="truncate font-mono text-xs">{docNoVal || "—"}</p>
                  {extDocVal && (
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{extDocVal}</p>
                  )}
                </TableCell>
                <TableCell
                  className="text-xs px-2 max-w-[200px] truncate"
                  title={descVal || ""}
                >
                  {descVal || "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-xs px-2 tabular-nums font-medium whitespace-nowrap">
                  <MoneyFormat value={mov.monto} />
                </TableCell>
                <TableCell className="px-2">
                  {mov.regla_cruce && (
                    <RuleBadge regla={mov.regla_cruce} variant="compact" />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

interface SplitViewProps {
  bankMovements: MovimientoBancoPendiente[];
  erpMovements: MovimientoErp[];
  isLoadingBank?: boolean;
  isLoadingErp?: boolean;
  bankEmptyMessage?: string;
  erpEmptyMessage?: string;
}

export function SplitView({
  bankMovements,
  erpMovements,
  isLoadingBank = false,
  isLoadingErp = false,
  bankEmptyMessage,
  erpEmptyMessage,
}: SplitViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Extracto Bancario
            <Badge variant="secondary" className="ml-2 text-xs">
              {bankMovements.length} mov.
            </Badge>
          </h3>
        </div>
        <div className="flex-1 min-h-0 p-2 overflow-hidden">
          <BankMovementsTable
            movements={bankMovements}
            isLoading={isLoadingBank}
            emptyMessage={bankEmptyMessage}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Libro Mayor BC
            <Badge variant="secondary" className="ml-2 text-xs">
              {erpMovements.length} mov.
            </Badge>
          </h3>
        </div>
        <div className="flex-1 min-h-0 p-2 overflow-hidden">
          <ErpMovementsTable
            movements={erpMovements}
            isLoading={isLoadingErp}
            emptyMessage={erpEmptyMessage}
          />
        </div>
      </div>
    </div>
  );
}
