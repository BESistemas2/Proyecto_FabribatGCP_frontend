"use client";

import { useState, useCallback } from "react";
import {
  AlertCircle,
  Upload,
  Eye,
  RotateCcw,
  Settings,
  Shield,
  CheckCircle,
  Table as TableIcon,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils/cn";
import { CargaExtracto, FiltrosCargas } from "@/types/bancos";
import {
  useCuentasBancarias,
  useCargasExtractos,
  useUploadExtracto,
  useSincronizarCatalogo,
} from "@/lib/hooks/use-bancos";
import { useAuth } from "@/lib/hooks/use-auth";
import { CargaForm } from "@/components/cargas/carga-form";
import { FileValidationResult } from "@/components/cargas/dropzone-uploader";
import {
  RPAStatusWidget,
  RPAStatusData,
} from "@/components/cargas/rpa-status-widget";
import { CargasHistoryTable } from "@/components/cargas/cargas-history-table";
import { useToast } from "@/lib/hooks/use-toast";
import { parseFecha } from "@/lib/utils/format";

export default function CargasPage() {
  const { toast } = useToast();
  const { user, puedeOperar, esAdmin } = useAuth();
  const userEmail = user?.email || "";
  // Cambiar la key vuelve a montar el formulario (limpia archivo y vista previa tras subir)
  const [formKey, setFormKey] = useState(0);

  const { data: cuentas, isLoading: cuentasLoading } = useCuentasBancarias();
  const [filtros, setFiltros] = useState<FiltrosCargas>({ page: 1, limit: 10 });
  const {
    data: cargasData,
    isLoading: cargasLoading,
    refetch: refetchCargas,
  } = useCargasExtractos(filtros);
  const uploadMutation = useUploadExtracto();
  const sincronizarMutation = useSincronizarCatalogo();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<FileValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"nueva" | "historial" | "rpa">(
    "nueva",
  );

  const cargas = Array.isArray(cargasData)
    ? cargasData
    : cargasData?.data || [];

  const total = Array.isArray(cargasData)
    ? cargasData.length
    : cargasData?.total || cargas.length;

  const page = cargasData?.page || 1;
  const limit = cargasData?.limit || 10;

  // ¿La carga es de hoy? (el backend guarda la hora de Ecuador sin zona: se lee como hora local)
  const isRecentOrToday = (fechaRaw: string | undefined) => {
    const d = parseFecha(fechaRaw);
    return !!d && d.toDateString() === new Date().toDateString();
  };

  // Cálculo corregido para los indicadores KPI
  const completadasHoy = cargas.filter((c: any) => {
    const st = String(c.estado || "").toUpperCase();
    const isOk =
      st === "COMPLETADO" ||
      st === "COMPLETADA" ||
      st === "SUCCESS" ||
      st === "OK";
    return isOk && isRecentOrToday(c.fecha_carga || c.created_at);
  }).length;

  const erroresHoy = cargas.filter((c: any) => {
    const st = String(c.estado || "").toUpperCase();
    const isErr = st === "ERROR" || st === "FAILED" || st === "FALLIDO";
    return isErr && isRecentOrToday(c.fecha_carga || c.created_at);
  }).length;

  const handleFileValidated = useCallback(
    (file: File, result: FileValidationResult) => {
      setSelectedFile(file);
      setValidationResult(result);
    },
    [],
  );

  const handleUpload = async (
    formData: { id_cuenta: string; created_by: string; origen: "MANUAL" },
    file: File,
    result: { valid: boolean },
  ) => {
    if (!result.valid || !file) return;

    try {
      const r = await uploadMutation.mutateAsync({ id_cuenta: formData.id_cuenta, archivo: file });

      toast({
        title: r.advertencias.length ? "Carga completada con advertencias" : "Carga completada",
        description: r.mensaje,
        variant: r.advertencias.length ? "warning" : "success",
      });
      setSelectedFile(null);
      setValidationResult(null);
      setFormKey((k) => k + 1);
    } catch (error) {
      toast({
        title: "Error al subir",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setFiltros((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFiltros((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleRefresh = () => {
    refetchCargas();
  };

  const handleSincronizar = async () => {
    try {
      const result = await sincronizarMutation.mutateAsync();
      toast({
        title: "Catálogo sincronizado",
        description: `${(result as any).total_procesados ?? 0} cuentas actualizadas desde Business Central.`,
        variant: "success",
      });
      refetchCargas();
    } catch (error) {
      toast({
        title: "Error sincronizando",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (carga: CargaExtracto) => {
    toast({
      title: `Detalles de ${carga.nombre_archivo || "Extracto"}`,
      description: carga.mensaje_log || "Sin detalle registrado para esta carga.",
      variant: carga.estado === "ERROR" ? "destructive" : undefined,
    });
  };

  const rpaStatusData: RPAStatusData = {
    estado: "MODO_MANUAL",
    ultimaEjecucion: undefined,
    proximaEjecucion: undefined,
    frecuencia: "DIARIA",
    horaEjecucion: "02:00",
    intervaloMinutos: 60,
    cuentasMonitoreadas: cuentas?.length || 0,
    ejecucionesExitosas: 0,
    ejecucionesFallidas: 0,
    mensaje: "RPA Playwright no configurado. Operando en modo manual.",
  };

  return (
    <div className="flex flex-col gap-6 h-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Centro de Cargas ETL
          </h1>
          <p className="text-muted-foreground">
            Carga manual de extractos bancarios y estado del procesamiento RPA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSincronizar}
            disabled={!esAdmin || sincronizarMutation.isPending || cuentasLoading}
            title={esAdmin ? undefined : "Solo el administrador puede sincronizar con Business Central"}
          >
            <RotateCcw
              className={cn(
                "h-4 w-4 mr-2",
                sincronizarMutation.isPending && "animate-spin",
              )}
            />
            Sincronizar Catálogo BC
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={cargasLoading}
          >
            <RotateCcw
              className={cn("h-4 w-4 mr-2", cargasLoading && "animate-spin")}
            />
            Actualizar
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "nueva" | "historial" | "rpa")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nueva">
            <Upload className="h-4 w-4 mr-2" />
            Nueva Carga
          </TabsTrigger>
          <TabsTrigger value="historial">
            <Eye className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="rpa">
            <Shield className="h-4 w-4 mr-2" />
            Estado RPA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nueva" className="mt-4 animate-in min-w-0">
          {!cuentasLoading && cuentas && cuentas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No hay cuentas bancarias configuradas
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Para cargar extractos, primero debe sincronizar el catálogo de
                  cuentas desde Dynamics 365 Business Central o crear cuentas
                  manualmente en la sección de Configuración.
                </p>
                <Button
                  onClick={handleSincronizar}
                  disabled={!esAdmin || sincronizarMutation.isPending}
                  size="lg"
                >
                  {sincronizarMutation.isPending
                    ? "Sincronizando..."
                    : "Sincronizar Catálogo Ahora"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] min-w-0">
              {/* COLUMNA IZQUIERDA: Formulario */}
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] overflow-y-auto">
                {puedeOperar ? (
                  <CargaForm
                    key={formKey}
                    cuentas={cuentas || []}
                    currentUserEmail={userEmail}
                    onSubmit={handleUpload}
                    onFileValidated={handleFileValidated}
                    isSubmitting={uploadMutation.isPending}
                    disabled={cuentasLoading}
                  />
                ) : (
                  <Alert>
                    <AlertDescription>
                      Su rol solo permite consultar. Para cargar extractos se necesita el rol
                      Contabilidad o Administrador.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* COLUMNA DERECHA: Resumen + Vista Previa Dinámica (min-w-0 evita desbordamiento CSS Grid) */}
              <div className="space-y-6 min-w-0 overflow-hidden">
                <Card className="min-w-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="h-5 w-5 text-primary" />
                      Resumen de Carga
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Origen</p>
                        <div className="font-medium mt-0.5">
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            MANUAL
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Trazabilidad
                        </p>
                        <p className="font-medium text-xs sm:text-sm text-foreground truncate mt-0.5">
                          {userEmail}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                          <p className="font-semibold">Modo Manual Activo</p>
                          <p className="mt-0.5 opacity-90">
                            El RPA autónomo (Playwright) no tiene accesos a
                            portales bancarios. Esta interfaz permite la
                            operación inmediata.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-2 border rounded-md bg-card">
                        <p className="text-2xl font-bold text-primary">
                          {cuentas?.length || 0}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Cuentas disponibles
                        </p>
                      </div>
                      <div className="p-2 border rounded-md bg-card">
                        <p className="text-2xl font-bold text-green-600">
                          {completadasHoy}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Completadas hoy
                        </p>
                      </div>
                      <div className="p-2 border rounded-md bg-card">
                        <p className="text-2xl font-bold text-red-600">
                          {erroresHoy}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Con errores hoy
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* VISTA PREVIA INLINE DE LA TABLA (Wrap seguro contra desbordamiento) */}
                {selectedFile && validationResult?.preview ? (
                  <Card className="border-primary/20 shadow-sm animate-in fade-in-50 min-w-0 max-w-full overflow-hidden">
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <TableIcon className="h-5 w-5 text-primary" />
                            Vista Previa: {selectedFile.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            Muestra de las primeras filas detectadas en la hoja
                            de cálculo
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs font-mono bg-background"
                          >
                            {validationResult.preview.totalRows} filas
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs font-mono bg-background"
                          >
                            {validationResult.preview.headers.length} columnas
                          </Badge>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" /> Válido
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 min-w-0">
                      <div className="max-h-[360px] overflow-auto border-b w-full min-w-0">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-muted sticky top-0 z-10">
                            <tr className="text-left text-muted-foreground border-b">
                              <th className="p-2.5 font-mono w-12 text-center border-r bg-muted">
                                #
                              </th>
                              {validationResult.preview.headers.map(
                                (header, idx) => (
                                  <th
                                    key={idx}
                                    className="p-2.5 font-semibold whitespace-nowrap border-r last:border-r-0 bg-muted"
                                  >
                                    {header}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {validationResult.preview.rows.map(
                              (row, rowIdx) => (
                                <tr
                                  key={rowIdx}
                                  className="border-b hover:bg-muted/40 transition-colors"
                                >
                                  <td className="p-2 font-mono text-center text-muted-foreground bg-muted/10 border-r">
                                    {rowIdx + 1}
                                  </td>
                                  {row.map((cell, cellIdx) => (
                                    <td
                                      key={cellIdx}
                                      className="p-2.5 font-mono whitespace-nowrap border-r last:border-r-0 text-foreground"
                                    >
                                      {cell || "—"}
                                    </td>
                                  ))}
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* Placeholder Informativo */
                  <Card className="border-dashed border-2 bg-muted/10 min-w-0">
                    <CardContent className="py-10 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Sin archivo seleccionado para vista previa
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Arrastre un archivo Excel o CSV en el panel de la
                        izquierda para visualizar aquí la estructura de columnas
                        y filas detectadas.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historial" className="mt-4 animate-in">
          <CargasHistoryTable
            cargas={cargas}
            isLoading={cargasLoading}
            total={total}
            page={page}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onRefresh={handleRefresh}
            onViewDetails={handleViewDetails}
            
          />
        </TabsContent>

        <TabsContent value="rpa" className="mt-4 animate-in">
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] min-w-0">
            <div className="lg:sticky lg:top-24">
              <RPAStatusWidget data={rpaStatusData} showStats />
            </div>
            <div className="space-y-6 min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración RPA (Futuro)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="default">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      El bot Playwright requiere accesos a portales bancarios
                      (token API, certificados, credenciales). Mientras no estén
                      disponibles, el sistema opera en{" "}
                      <strong>Modo Manual</strong>.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Frecuencia de Ejecución
                      </p>
                      <select
                        className="w-full border rounded-md px-3 py-2 bg-background"
                        disabled
                      >
                        <option>DIARIA (cada 24h)</option>
                        <option>SEMANAL (lunes 02:00)</option>
                        <option>MENSUAL (día 1 02:00)</option>
                      </select>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Hora de Ejecución
                      </p>
                      <input
                        type="time"
                        defaultValue="02:00"
                        className="w-full border rounded-md px-3 py-2 bg-background"
                        disabled
                      />
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Intervalo (min)
                      </p>
                      <input
                        type="number"
                        defaultValue={60}
                        min={15}
                        max={1440}
                        className="w-full border rounded-md px-3 py-2 bg-background"
                        disabled
                      />
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Cuentas a Monitorear
                      </p>
                      <p className="font-mono text-lg">
                        {cuentas?.length || 0}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <h4 className="font-medium">
                    Requisitos para Activación RPA
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />{" "}
                      Credenciales API bancarias (token OAuth2 / certificado)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />{" "}
                      Acceso a portal Business Central (D365 BC)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />{" "}
                      Configuración de variables de entorno en servidor
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />{" "}
                      Playwright instalado y navegadores (chromium/firefox)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />{" "}
                      Programación cron / systemd para ejecución recurrente
                    </li>
                  </ul>

                  <Separator />

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div className="text-xs text-blue-800 dark:text-blue-200">
                        <p className="font-medium">Arquitectura Preparada</p>
                        <p className="mt-1">
                          Los endpoints{" "}
                          <code className="px-1.5 py-0.5 bg-background rounded font-mono">
                            POST /bancos/cargas/upload
                          </code>
                          y el payload{" "}
                          <code className="px-1.5 py-0.5 bg-background rounded font-mono">
                            {
                              " { id_cuenta, created_by, origen: 'RPA', archivo } "
                            }
                          </code>
                          son idénticos. El bot solo debe autenticarse y enviar
                          el mismo FormData.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
