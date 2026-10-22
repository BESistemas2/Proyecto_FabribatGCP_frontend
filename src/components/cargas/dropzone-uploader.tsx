"use client";

import { useCallback, useRef, useState, DragEvent, ChangeEvent } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  preview?: {
    headers: string[];
    rows: string[][];
    totalRows: number;
  };
}

export interface DropzoneUploaderProps {
  onFileValidated: (file: File, result: FileValidationResult) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  requiredHeaders?: string[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = [".xlsx", ".xls", ".csv"];
const DEFAULT_MAX_SIZE_MB = 15;
const DEFAULT_REQUIRED_HEADERS = ["Fecha", "Concepto", "Monto", "Referencia"];

const HEADER_SYNONYMS: Record<string, string[]> = {
  fecha: [
    "fecha",
    "f. transaccion",
    "f.transaccion",
    "fecha proceso",
    "posting date",
    "date",
    "f. valor",
    "fecha tx",
  ],
  concepto: [
    "concepto",
    "descripcion",
    "descripción",
    "detalle",
    "leyenda",
    "observacion",
    "observaciones",
    "description",
    "transaccion",
  ],
  monto: [
    "monto",
    "valor",
    "importe",
    "debito",
    "credito",
    "monto usd",
    "amount",
    "saldo",
  ],
  referencia: [
    "referencia",
    "num doc",
    "documento",
    "secuencial",
    "comprobante",
    "ref",
    "nro. doc",
    "nro doc",
    "nro. comprobante",
  ],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Vista previa: solo se leen las primeras filas (la validación completa la hace el backend)
const FILAS_VISTA_PREVIA = 35;

async function parseFile(
  file: File,
  requiredHeaders: string[],
): Promise<FileValidationResult> {
  // xlsx (~400 kB) se descarga solo cuando el usuario elige un archivo
  const XLSX = await import("xlsx");
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            valid: false,
            errors: ["No se pudo leer el archivo"],
            warnings: [],
          });
          return;
        }

        const arrayBuffer = data as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
          type: "array",
          sheetRows: FILAS_VISTA_PREVIA,
        });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          resolve({
            valid: false,
            errors: ["El archivo no contiene hojas válidas"],
            warnings: [],
          });
          return;
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawMatrix = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          raw: false,
          defval: "",
        }) as any[][];

        if (!rawMatrix || rawMatrix.length === 0) {
          resolve({
            valid: false,
            errors: ["El archivo está vacío"],
            warnings: [],
          });
          return;
        }

        let bestHeaderRowIndex = 0;
        let maxMatchesCount = 0;

        const reqKeys = requiredHeaders.map((h) => normalizeText(h));
        const scanLimit = Math.min(15, rawMatrix.length);

        for (let i = 0; i < scanLimit; i++) {
          const rowCells = (rawMatrix[i] || []).map((c) =>
            normalizeText(String(c)),
          );

          let matches = 0;
          reqKeys.forEach((reqKey) => {
            const synonyms = HEADER_SYNONYMS[reqKey] || [reqKey];
            const hasMatch = rowCells.some((cell) =>
              synonyms.some((syn) => cell.includes(normalizeText(syn))),
            );
            if (hasMatch) matches++;
          });

          if (matches > maxMatchesCount) {
            maxMatchesCount = matches;
            bestHeaderRowIndex = i;
          }
        }

        const headerRow = rawMatrix[bestHeaderRowIndex] || [];
        const headers = headerRow
          .map((h) => String(h || "").trim())
          .filter(Boolean);

        const dataRows = rawMatrix
          .slice(bestHeaderRowIndex + 1)
          .filter((row) =>
            row.some(
              (cell) =>
                cell !== null &&
                cell !== undefined &&
                String(cell).trim() !== "",
            ),
          );

        const previewRows = dataRows
          .slice(0, 10)
          .map((row) => row.map((c) => String(c || "").trim()));

        const errors: string[] = [];
        const warnings: string[] = [];

        if (headers.length === 0) {
          errors.push("El archivo no tiene cabeceras de columna válidas");
        }

        if (bestHeaderRowIndex > 0) {
          warnings.push(
            `Cabecera detectada automáticamente en la fila ${bestHeaderRowIndex + 1}`,
          );
        }

        resolve({
          valid: errors.length === 0,
          errors,
          warnings,
          preview: {
            headers,
            rows: previewRows,
            totalRows: dataRows.length,
          },
        });
      } catch (err) {
        resolve({
          valid: false,
          errors: ["Error al procesar la estructura del archivo"],
          warnings: [],
        });
      }
    };

    reader.onerror = () =>
      resolve({
        valid: false,
        errors: ["Error al leer el archivo desde el disco"],
        warnings: [],
      });

    reader.readAsArrayBuffer(file);
  });
}

export function DropzoneUploader({
  onFileValidated,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  requiredHeaders = DEFAULT_REQUIRED_HEADERS,
  disabled = false,
  className,
}: DropzoneUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<FileValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  // Evita que el resultado de un archivo anterior pise al del archivo elegido después
  const validacionActual = useRef(0);

  const validateFile = useCallback(
    async (file: File) => {
      const id = ++validacionActual.current;
      setIsValidating(true);
      setValidationResult(null);
      const errors: string[] = [];
      const warnings: string[] = [];

      if (
        !acceptedTypes.some((type) =>
          file.name.toLowerCase().endsWith(type.toLowerCase()),
        )
      ) {
        errors.push(
          `Tipo de archivo no permitido. Use: ${acceptedTypes.join(", ")}`,
        );
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        errors.push(
          `Archivo excede ${maxSizeMB}MB (actual: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        );
      }

      if (errors.length > 0) {
        const result = { valid: false, errors, warnings, preview: undefined };
        setValidationResult(result);
        onFileValidated(file, result);
        setIsValidating(false);
        return;
      }

      const result = await parseFile(file, requiredHeaders);
      if (id !== validacionActual.current) return; // llegó otro archivo mientras se leía este
      setValidationResult(result);
      onFileValidated(file, result);
      setIsValidating(false);
    },
    [acceptedTypes, maxSizeMB, onFileValidated, requiredHeaders],
  );

  const handleDrag = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled)
        setIsDragActive(e.type === "dragenter" || e.type === "dragover");
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        setSelectedFile(file);
        validateFile(file);
      }
    },
    [disabled, validateFile],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        validateFile(file);
      }
    },
    [validateFile],
  );

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setValidationResult(null);
    onFileValidated(new File([], ""), {
      valid: false,
      errors: [],
      warnings: [],
    });
  }, [onFileValidated]);

  const getCleanFileType = (file: File) => {
    if (file.name.endsWith(".xlsx")) return "Excel (.xlsx)";
    if (file.name.endsWith(".xls")) return "Excel (.xls)";
    if (file.name.endsWith(".csv")) return "CSV (.csv)";
    return file.type || "Hoja de cálculo";
  };

  if (selectedFile && validationResult) {
    return (
      <>
        <Card className={cn("border-primary/20 bg-primary/5", className)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              Archivo Seleccionado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="overflow-hidden">
                  <p
                    className="font-medium text-sm truncate max-w-[220px]"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                    {getCleanFileType(selectedFile)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={removeFile}
                disabled={isValidating}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isValidating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando estructura de archivo...
              </div>
            )}

            {!isValidating && (
              <>
                {validationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    {validationResult.errors.map((err, i) => (
                      <Badge
                        key={i}
                        variant="destructive"
                        className="gap-1 flex items-center text-xs whitespace-normal text-left"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{err}</span>
                      </Badge>
                    ))}
                  </div>
                )}

                {validationResult.warnings.length > 0 && (
                  <div className="space-y-1">
                    {validationResult.warnings.map((warn, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="gap-1 flex items-center bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs whitespace-normal text-left"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{warn}</span>
                      </Badge>
                    ))}
                  </div>
                )}

                {validationResult.valid && (
                  <div className="space-y-3">
                    <Badge
                      variant="default"
                      className="gap-1 flex items-center bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 text-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Archivo válido y listo para subir</span>
                    </Badge>

                    {validationResult.preview && (
                      <div className="flex items-center gap-2.5 p-3 border rounded-lg bg-background shadow-xs">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                          <TableIcon className="h-4 w-4 text-primary shrink-0" />
                          <span>
                            <strong className="font-semibold text-foreground">
                              {validationResult.preview.totalRows}
                            </strong>{" "}
                            filas en la vista previa,{" "}
                            <strong className="font-semibold text-foreground">
                              {validationResult.preview.headers.length}
                            </strong>{" "}
                            columnas
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      </>
    );
  }

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-all duration-200",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center justify-center text-center">
          <input
            type="file"
            id="file-upload"
            accept={acceptedTypes.join(",")}
            onChange={handleFileChange}
            disabled={disabled || isValidating}
            className="sr-only"
            aria-label="Subir archivo de extracto bancario"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer"
            style={{ cursor: disabled ? "not-allowed" : "pointer" }}
          >
            <div
              className={cn(
                "mb-4 p-3 rounded-full",
                isDragActive ? "bg-primary/10" : "bg-muted",
              )}
            >
              <Upload
                className={cn(
                  "h-12 w-12 mx-auto",
                  isDragActive ? "text-primary" : "text-muted-foreground",
                )}
              />
            </div>
            <p className="text-lg font-medium mb-1">
              {isDragActive
                ? "Suelte el archivo aquí"
                : "Arrastre y suelte el extracto bancario"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              o haga clic para seleccionar (.xlsx, .xls, .csv • máx. {maxSizeMB}{" "}
              MB)
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                Headers esperados: {requiredHeaders.join(", ")}
              </Badge>
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
