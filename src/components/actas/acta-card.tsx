"use client";

import {
  ResultadoConciliacionResponse,
  EstadoActa,
} from "@/types/conciliacion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Building2,
  Download,
  Eye,
  Mail,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";

interface ActaCardProps {
  acta: ResultadoConciliacionResponse;
  onViewTransito: (acta: ResultadoConciliacionResponse) => void;
  onDownload?: (acta: ResultadoConciliacionResponse) => void;
  onSendEmail?: (acta: ResultadoConciliacionResponse) => void;
}

const ESTADO_CONFIG: Record<EstadoActa, { label: string; className: string }> =
  {
    BORRADOR: {
      label: "Borrador",
      className:
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    },
    CERRADO: {
      label: "Cerrado",
      className:
        "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    APROBADO: {
      label: "Aprobado",
      className:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    },
  };

export function ActaCard({
  acta,
  onViewTransito,
  onDownload,
  onSendEmail,
}: ActaCardProps) {
  const estadoConfig =
    ESTADO_CONFIG[acta.estado as EstadoActa] || ESTADO_CONFIG.BORRADOR;

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2 bg-muted/30 border-b">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col gap-1.5 overflow-hidden">
            <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate" title={`Cuenta contable ${acta.cuenta_contable}`}>{acta.banco || acta.cuenta_contable}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{acta.periodo}</span>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn("flex-shrink-0 text-[10px]", estadoConfig.className)}
          >
            {estadoConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Mov. neto banco:</span>
            <span className="font-mono font-medium">
              {formatCurrency(Number(acta.saldo_banco))}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Mov. neto libros:</span>
            <span className="font-mono font-medium">
              {formatCurrency(Number(acta.saldo_libros))}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-medium text-foreground">Partidas pendientes:</span>
            <span className="font-mono font-semibold text-primary">
              {acta.total_partidas_en_transito ?? 0}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 bg-muted/10 border-t flex justify-between gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={() => onViewTransito(acta)}
        >
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          Detalles
        </Button>
        <div className="flex gap-1">
          {onSendEmail && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Enviar por correo"
              onClick={() => onSendEmail(acta)}
            >
              <Mail className="h-4 w-4" />
            </Button>
          )}
          {onDownload && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Descargar Excel"
              onClick={() => onDownload(acta)}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export function ActaCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-4 pb-2 bg-muted/30 border-b">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="pt-2 border-t flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-muted/10 border-t flex justify-between gap-2">
        <Skeleton className="h-8 flex-1" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardFooter>
    </Card>
  );
}
