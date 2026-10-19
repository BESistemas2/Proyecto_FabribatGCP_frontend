"use client";

import { useState } from "react";
import { Mail, Download, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";
import { conciliacionApi } from "@/lib/api/conciliacion";

interface EnviarReporteModalProps {
  idActa: string;
  defaultEmail?: string;
}

export function EnviarReporteModal({
  idActa,
  defaultEmail = "",
}: EnviarReporteModalProps) {
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [comentario, setComentario] = useState("");

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Manejador para descargar el Excel directamente
  const handleDescargar = async () => {
    try {
      setIsDownloading(true);

      // Utilizamos el adaptador de la API que maneja el Blob
      await conciliacionApi.descargarExcelActa(idActa);

      toast({
        title: "Descarga exitosa",
        description: "El reporte de conciliación se descargó correctamente.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error de descarga",
        description: "Hubo un problema al generar el archivo Excel.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Manejador para disparar el envío por correo en el backend
  const handleEnviarCorreo = async () => {
    if (!email) return;
    setIsSending(true);

    try {
      await conciliacionApi.enviarReporteEmail(idActa, {
        destinatarios: [email],
        comentario,
      });

      toast({
        title: "Reporte en camino",
        description: `El informe de conciliación se está enviando a ${email}`,
        variant: "success",
      });

      setOpen(false);
      setComentario(""); // Limpiamos el comentario para futuras aperturas
    } catch (error) {
      toast({
        title: "Error al enviar",
        description: error instanceof Error ? error.message : "No se pudo enviar el correo.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Mail className="h-4 w-4 text-primary" />
          Enviar Reporte / Exportar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Exportar / Enviar Informe de Conciliación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Botón de Descarga Directa */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleDescargar}
              disabled={isDownloading || isSending}
              className="w-full gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar Excel (.xlsx)
            </Button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-muted"></div>
            <span className="flex-shrink mx-2 text-xs text-muted-foreground uppercase font-mono">
              O enviar por email
            </span>
            <div className="flex-grow border-t border-muted"></div>
          </div>

          {/* Formulario de Envío de Correo */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              Correo del Destinatario *
            </label>
            <Input
              type="email"
              placeholder="ejemplo@bateriasecuador.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isDownloading || isSending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              Comentario Opcional
            </label>
            <Input
              placeholder="Observaciones de la conciliación..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              disabled={isDownloading || isSending}
            />
          </div>

          {/* Botón de Enviar Correo */}
          <Button
            onClick={handleEnviarCorreo}
            disabled={!email || isDownloading || isSending}
            className="w-full gap-2 mt-2"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando envío...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Informe por Correo
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
