'use client';

import { useState } from 'react';
import { X, Download, Printer, Loader2, AlertCircle, FileText, ChevronRight, RotateCcw, Lock, Unlock } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { MoneyFormat } from '@/components/shared/money-format';
import { formatDate, sumarMontos } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { ResultadoConciliacionResponse } from '@/types/conciliacion';
import type { PartidaTransito } from '@/types/conciliacion';
import { useActaDetalle, useCerrarActa, useReabrirActa } from '@/lib/hooks/use-conciliacion';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/lib/hooks/use-toast';

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CREDITO: { label: 'Crédito', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
  DEBITO: { label: 'Débito', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
};

interface PartidasTransitoDrawerProps {
  acta: ResultadoConciliacionResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (acta: ResultadoConciliacionResponse) => void;
  onPrint?: (acta: ResultadoConciliacionResponse) => void;
}

export function PartidasTransitoDrawer({
  acta,
  open,
  onOpenChange,
  onDownload,
  onPrint,
}: PartidasTransitoDrawerProps) {
  const [activeTab, setActiveTab] = useState<'banco' | 'erp'>('banco');
  const { puedeOperar, esAdmin } = useAuth();
  const { toast } = useToast();
  // React Query: cancela respuestas viejas al cambiar de acta y comparte caché
  const { data: detalle, isLoading, error: errorQuery, refetch } = useActaDetalle(acta?.id_acta, open);
  const error = errorQuery?.message ?? null;
  const fetchDetalle = () => refetch();
  const cerrarMutation = useCerrarActa();
  const reabrirMutation = useReabrirActa();

  // El estado vigente sale del detalle (se actualiza al cerrar/reabrir)
  const estado = detalle?.acta.estado ?? acta?.estado;
  const enBorrador = estado === 'BORRADOR';

  const cambiarEstado = (accion: 'cerrar' | 'reabrir') => {
    if (!acta) return;
    const mutation = accion === 'cerrar' ? cerrarMutation : reabrirMutation;
    mutation.mutate(acta.id_acta, {
      onSuccess: () =>
        toast({
          title: accion === 'cerrar' ? 'Acta cerrada' : 'Acta reabierta',
          description: accion === 'cerrar'
            ? 'Las partidas en tránsito quedaron congeladas.'
            : 'El acta volvió a BORRADOR y se puede volver a conciliar.',
          variant: 'success',
        }),
      onError: (e) => toast({ title: 'No se pudo cambiar el estado', description: e.message, variant: 'destructive' }),
    });
  };

  if (!acta) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex flex-col h-full max-w-4xl">
        <DrawerHeader className="p-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle className="text-lg font-semibold">
                Partidas en Tránsito — {acta.cuenta_contable || 'Acta'}
              </DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Período: {acta.periodo} • Estado: {estado}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Cargando detalle del acta...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={fetchDetalle} className="mt-4">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          ) : detalle ? (
            <div className="flex flex-col h-full p-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'banco' | 'erp')} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="banco">
                    <FileText className="h-4 w-4 mr-2" />
                    Banco ({detalle.partidas_transito_banco?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="erp">
                    <FileText className="h-4 w-4 mr-2" />
                    ERP BC ({detalle.partidas_transito_erp?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="banco" className="flex-1 flex flex-col min-h-0">
                  {detalle.partidas_transito_banco && detalle.partidas_transito_banco.length > 0 ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      <ScrollArea className="flex-1">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                            <TableRow>
                              <TableHead className="w-24">Fecha</TableHead>
                              <TableHead className="w-32">Referencia</TableHead>
                              <TableHead>Concepto</TableHead>
                              <TableHead className="w-28 text-right">Monto</TableHead>
                              <TableHead className="w-24">Tipo</TableHead>
                              <TableHead className="w-36">Regla</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detalle.partidas_transito_banco.map((partida) => (
                              <TableRow key={partida.id} className="hover:bg-muted/50">
                                <TableCell className="font-mono text-sm whitespace-nowrap">
                                  {formatDate(partida.fecha)}
                                </TableCell>
                                <TableCell className="font-mono text-sm">{partida.referencia || '—'}</TableCell>
                                <TableCell className="max-w-xs truncate">{partida.concepto}</TableCell>
                                <TableCell className="text-right font-mono tabular-nums">
                                  <MoneyFormat value={partida.monto} />
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={cn((TIPO_CONFIG[partida.tipo] ?? TIPO_CONFIG.CREDITO).bg, 'text-xs')}>
                                    {(TIPO_CONFIG[partida.tipo] ?? { label: partida.tipo }).label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {partida.regla_cruce && (
                                    <Badge variant="outline" className="text-xs">
                                      {partida.regla_cruce}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total: {detalle.partidas_transito_banco.length} partidas
                        </span>
                        <MoneyFormat
                          value={getTotal(detalle.partidas_transito_banco)}
                          className="font-bold text-lg tabular-nums"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <p>No hay partidas en tránsito del Banco para este acta</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="erp" className="flex-1 flex flex-col min-h-0">
                  {detalle.partidas_transito_erp && detalle.partidas_transito_erp.length > 0 ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      <ScrollArea className="flex-1">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                            <TableRow>
                              <TableHead className="w-24">Fecha</TableHead>
                              <TableHead className="w-28">Entry No.</TableHead>
                              <TableHead className="w-32">Doc. No.</TableHead>
                              <TableHead>Descripción</TableHead>
                              <TableHead className="w-28 text-right">Monto</TableHead>
                              <TableHead className="w-36">Regla</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detalle.partidas_transito_erp.map((partida) => (
                              <TableRow key={partida.id} className="hover:bg-muted/50">
                                <TableCell className="font-mono text-sm whitespace-nowrap">
                                  {formatDate(partida.fecha)}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {partida.entry_no ?? '—'}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {partida.documento || partida.referencia || '—'}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">{partida.concepto}</TableCell>
                                <TableCell className="text-right font-mono tabular-nums">
                                  <MoneyFormat value={partida.monto} />
                                </TableCell>
                                <TableCell>
                                  {partida.regla_cruce && (
                                    <Badge variant="outline" className="text-xs">
                                      {partida.regla_cruce}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total: {detalle.partidas_transito_erp.length} partidas
                        </span>
                        <MoneyFormat
                          value={getTotal(detalle.partidas_transito_erp)}
                          className="font-bold text-lg tabular-nums"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <p>No hay partidas en tránsito del ERP para este acta</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No se pudo cargar el detalle del acta</p>
              <Button variant="outline" onClick={fetchDetalle} className="mt-4">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          )}
        </div>

        <DrawerFooter className="p-4 border-t flex flex-wrap gap-2">
          <div className="flex-1" />
          {onPrint && (
            <Button variant="outline" onClick={() => onPrint(acta)}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Resumen
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" onClick={() => onDownload(acta)}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
          )}
          {puedeOperar && enBorrador && (
            <Button variant="secondary" onClick={() => cambiarEstado('cerrar')} disabled={cerrarMutation.isPending}>
              {cerrarMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
              Cerrar acta
            </Button>
          )}
          {esAdmin && estado && !enBorrador && (
            <Button variant="secondary" onClick={() => cambiarEstado('reabrir')} disabled={reabrirMutation.isPending}>
              {reabrirMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unlock className="h-4 w-4 mr-2" />}
              Reabrir acta
            </Button>
          )}
          <Button variant="default" onClick={() => onOpenChange(false)}>
            <ChevronRight className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Los montos ya vienen con signo: el total es la suma directa (neto)
const getTotal = (partidas: PartidaTransito[]) => sumarMontos(partidas, (p) => p.monto);