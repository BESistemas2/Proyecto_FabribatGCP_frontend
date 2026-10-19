"use client";

import { useCallback, useState, DragEvent, ChangeEvent } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
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

function parseFile(
  file: File,
  requiredHeaders: string[],
): Promise<FileValidationResult> {
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
          sheetRows: 35,
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const validateFile = useCallback(
    async (file: File) => {
      setIsValidating(true);
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
    setIsPreviewOpen(false);
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 border rounded-lg bg-background shadow-xs">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                          <TableIcon className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">
                            <strong className="font-semibold text-foreground">
                              {validationResult.preview.totalRows}
                            </strong>{" "}
                            filas detectadas,{" "}
                            <strong className="font-semibold text-foreground">
                              {validationResult.preview.headers.length}
                            </strong>{" "}
                            columnas
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPreviewOpen(true)}
                          className="gap-1.5 h-8 text-xs font-medium w-full sm:w-auto shrink-0 justify-center"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          Ver Tabla Completa
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* MODAL PERSONALIZADO SIN RADIX UI */}
        {isPreviewOpen && validationResult.preview && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0"
            onClick={() => setIsPreviewOpen(false)}
          >
            <div
              className="relative bg-background border rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col p-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Encabezado del Modal */}
              <div className="flex items-start justify-between border-b pb-3 mb-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    Vista Previa del Extracto: {selectedFile.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Muestra de las primeras filas (
                    {validationResult.preview.totalRows} filas detectadas)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabla de Datos */}
              <div className="flex-1 overflow-auto border rounded-md my-1 bg-card">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="p-2 font-mono w-10 text-center border-r bg-muted">
                        #
                      </th>
                      {validationResult.preview.headers.map((h, i) => (
                        <th
                          key={i}
                          className="p-2.5 font-semibold whitespace-nowrap border-r last:border-r-0 bg-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.preview.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-2 font-mono text-center text-muted-foreground bg-muted/20 border-r">
                          {ri + 1}
                        </td>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="p-2 font-mono whitespace-nowrap border-r last:border-r-0"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pie del Modal */}
              <div className="flex justify-end pt-3 mt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-4 text-xs font-medium"
                >
                  Cerrar Vista Previa
                </Button>
              </div>
            </div>
          </div>
        )}
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
