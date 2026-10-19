"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Banknote,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import { CuentaBancaria } from "@/types/bancos";
import { DropzoneUploader, FileValidationResult } from "./dropzone-uploader";

function formatCuentaLabel(cuenta: CuentaBancaria): string {
  const alias = cuenta.alias || cuenta.banco_nombre || "";
  const num = cuenta.numero_cuenta || "";

  if (!num) return alias;

  if (alias.toLowerCase().includes(num.toLowerCase())) {
    return alias;
  }
  return `${alias} — ${num}`;
}

export const cargaFormSchema = z.object({
  id_cuenta: z.string().min(1, "Seleccione una cuenta bancaria válida"),
  created_by: z
    .string()
    .email("Email del responsable inválido")
    .min(1, "Requerido"),
  origen: z.literal("MANUAL"),
});

export type CargaFormData = z.infer<typeof cargaFormSchema>;

interface CargaFormProps {
  cuentas: CuentaBancaria[];
  currentUserEmail?: string;
  onSubmit: (
    data: CargaFormData,
    file: File,
    validationResult: FileValidationResult,
  ) => Promise<void>;
  onFileValidated?: (file: File, result: FileValidationResult) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function CargaForm({
  cuentas,
  currentUserEmail = "",
  onSubmit,
  onFileValidated,
  isSubmitting = false,
  disabled = false,
}: CargaFormProps) {
  const { user } = useAuth();
  const activeEmail = user?.email || currentUserEmail || "";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<FileValidationResult | null>(null);

  const [openCuenta, setOpenCuenta] = useState(false);
  const cuentaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cuentaContainerRef.current &&
        !cuentaContainerRef.current.contains(event.target as Node)
      ) {
        setOpenCuenta(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const form = useForm<CargaFormData>({
    resolver: zodResolver(cargaFormSchema),
    defaultValues: {
      id_cuenta: "",
      created_by: activeEmail,
      origen: "MANUAL",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (activeEmail) {
      form.setValue("created_by", activeEmail, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [activeEmail, form]);

  const handleFileValidated = (file: File, result: FileValidationResult) => {
    setSelectedFile(file);
    setValidationResult(result);
    onFileValidated?.(file, result);
  };

  const handleLimpiar = () => {
    form.reset();
    setSelectedFile(null);
    setValidationResult(null);
    onFileValidated?.(new File([], ""), {
      valid: false,
      errors: [],
      warnings: [],
    });
  };

  const handleSubmit = async (data: CargaFormData) => {
    if (!selectedFile || !validationResult?.valid) {
      return;
    }

    const cleanData: CargaFormData = {
      ...data,
      created_by: data.created_by || activeEmail,
      origen: "MANUAL",
    };

    await onSubmit(cleanData, selectedFile, validationResult);
  };

  const watchCuenta = form.watch("id_cuenta");
  const watchCreatedBy = form.watch("created_by") || activeEmail;

  const canSubmit =
    Boolean(selectedFile) &&
    Boolean(validationResult?.valid) &&
    Boolean(watchCuenta) &&
    Boolean(watchCreatedBy) &&
    !isSubmitting;

  const cuentaSeleccionada = cuentas.find((c) => c.id_cuenta === watchCuenta);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Nueva Carga de Extracto
        </CardTitle>
        <CardDescription>
          Complete los metadatos y seleccione el archivo de extracto bancario
          (Excel/CSV)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Campo Cuenta Bancaria */}
            <FormField
              control={form.control}
              name="id_cuenta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta Bancaria *</FormLabel>
                  <FormControl>
                    <div ref={cuentaContainerRef} className="relative w-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenCuenta(!openCuenta)}
                        className="w-full h-10 truncate justify-between text-left font-normal"
                        disabled={disabled || cuentas.length === 0}
                      >
                        {cuentaSeleccionada ? (
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="font-medium flex items-center gap-2 text-sm truncate">
                              <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" />
                              {formatCuentaLabel(cuentaSeleccionada)}
                            </span>
                            <span className="text-xs text-muted-foreground pl-6 truncate">
                              {cuentaSeleccionada.moneda} • CC:{" "}
                              {cuentaSeleccionada.cuenta_contable_bc}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {cuentas.length === 0
                              ? "No hay cuentas disponibles"
                              : "Seleccionar cuenta bancaria"}
                          </span>
                        )}
                        <ChevronDown
                          className={cn(
                            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
                            openCuenta && "rotate-180",
                          )}
                        />
                      </Button>

                      {openCuenta && (
                        <div className="absolute top-full left-0 mt-1 z-50 w-full max-h-[280px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
                          <div className="flex flex-col gap-1">
                            {cuentas.map((cuenta) => {
                              const isSelected =
                                cuenta.id_cuenta === field.value;
                              return (
                                <button
                                  key={cuenta.id_cuenta}
                                  type="button"
                                  onClick={() => {
                                    form.setValue(
                                      "id_cuenta",
                                      cuenta.id_cuenta,
                                      {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                        shouldTouch: true,
                                      },
                                    );
                                    setOpenCuenta(false);
                                  }}
                                  className={cn(
                                    "w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between gap-2 text-sm",
                                    isSelected && "bg-accent/80 font-medium",
                                  )}
                                >
                                  <div className="flex flex-col gap-0.5 overflow-hidden">
                                    <span className="font-medium flex items-center gap-2 truncate">
                                      <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" />
                                      {formatCuentaLabel(cuenta)}
                                    </span>
                                    <span className="text-xs text-muted-foreground pl-6 truncate">
                                      {cuenta.moneda} • CC:{" "}
                                      {cuenta.cuenta_contable_bc}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <Check className="h-4 w-4 shrink-0 text-primary" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Responsable */}
            <FormField
              control={form.control}
              name="created_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable (Email) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      readOnly
                      disabled={disabled}
                      className="bg-muted cursor-not-allowed font-mono text-sm"
                      placeholder="Cargando usuario autenticado..."
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormDescription>
                    Email del operador autenticado que realiza la carga
                    (trazabilidad)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Origen Estático */}
            <FormField
              control={form.control}
              name="origen"
              render={() => (
                <FormItem>
                  <FormLabel>Origen de la Carga *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2.5 h-10 px-3 py-2 border rounded-md bg-muted/40 text-sm">
                      <Badge
                        variant="secondary"
                        className="h-5 px-2 font-mono text-xs font-semibold"
                      >
                        MANUAL
                      </Badge>
                      <span className="text-muted-foreground text-xs sm:text-sm">
                        Carga manual por operador
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Identifica el origen para auditoría (MANUAL vs RPA futuro)
                  </FormDescription>
                </FormItem>
              )}
            />

            <Separator />

            {/* Uploader de Archivo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Archivo de Extracto *
                </label>
                <Badge variant="outline" className="text-xs">
                  {validationResult?.valid ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      Válido
                    </>
                  ) : selectedFile ? (
                    <>
                      <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                      Con errores
                    </>
                  ) : (
                    "Pendiente"
                  )}
                </Badge>
              </div>
              <DropzoneUploader
                onFileValidated={handleFileValidated}
                disabled={disabled || cuentas.length === 0}
              />
            </div>

            <Separator />

            {/* Botones de Acción */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={!canSubmit || disabled}
                className="flex-1 gap-2"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subiendo y Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Subir Extracto
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleLimpiar}
                disabled={disabled || isSubmitting}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
