'use client';

import { useEffect, useState } from 'react';
import { X, Download, Printer, Loader2, AlertCircle, CheckCircle, FileText, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
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
import { formatDate, formatMoney } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { ResultadoConciliacionResponse } from '@/types/conciliacion';
import { conciliacionApi, PartidaTransito, ActaDetalleResponse } from '@/lib/api/conciliacion';

const TIPO_CONFIG = {
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
  const [detalle, setDetalle] = useState<ActaDetalleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'banco' | 'erp'>('banco');

  useEffect(() => {
    if (open && acta) {
      fetchDetalle();
    } else {
      setDetalle(null);
    }
  }, [open, acta]);

  const fetchDetalle = async () => {
    if (!acta) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await conciliacionApi.getActaDetalle(acta.id_acta);
      setDetalle(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error cargando detalle';
      setError(message);
      console.error('Error fetching acta detalle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotal = (partidas: PartidaTransito[]) =>
    partidas.reduce((sum, p) => sum + (p.tipo === 'CREDITO' ? p.monto : -p.monto), 0);

  const getTotalAbs = (partidas: PartidaTransito[]) =>
    partidas.reduce((sum, p) => sum + Math.abs(p.monto), 0);

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
                Período: {acta.periodo} • Estado: {acta.estado}
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
                                  <Badge variant="secondary" className={cn(TIPO_CONFIG[partida.tipo].bg, 'text-xs')}>
                                    {TIPO_CONFIG[partida.tipo].label}
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
                                  {partida.referencia || '—'}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {partida.concepto || '—'}
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
              Exportar PDF
            </Button>
          )}
          <Button variant="default" onClick={() => onOpenChange(false)}>
            <ChevronRight className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

const getTotal = (partidas: PartidaTransito[]) =>
  partidas.reduce((sum, p) => sum + (p.tipo === 'CREDITO' ? p.monto : -p.monto), 0);

const getTotalAbs = (partidas: PartidaTransito[]) =>
  partidas.reduce((sum, p) => sum + Math.abs(p.monto), 0);