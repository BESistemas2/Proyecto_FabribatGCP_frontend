"use client";

import { useState } from "react";
import { useDestinatarios } from "@/lib/hooks/use-usuarios";
import { useEnviarReporteEmail } from "@/lib/hooks/use-conciliacion";
import { useToast } from "@/lib/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Send } from "lucide-react";
import { SelectorDestinatarios } from "@/components/shared/selector-destinatarios";

interface EnviarReporteModalProps {
  idActa: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnviarReporteModal({
  idActa,
  open,
  onOpenChange,
}: EnviarReporteModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comentario, setComentario] = useState("");

  const { data: usuarios = [] } = useDestinatarios();
  const enviarReporteMutation = useEnviarReporteEmail();
  const { toast } = useToast();

  const isSubmitting = enviarReporteMutation.isPending;

  const handleSend = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Selección requerida",
        description: "Debes seleccionar al menos un destinatario.",
        variant: "warning",
      });
      return;
    }

    // Transformar los IDs seleccionados en sus respectivos correos
    const correosDestinatarios = usuarios
      .filter((u) => selectedIds.includes(u.id_usuario))
      .map((u) => u.email);

    try {
      await enviarReporteMutation.mutateAsync({
        idActa,
        destinatarios: correosDestinatarios,
        comentario: comentario.trim() !== "" ? comentario : undefined,
      });

      toast({
        title: "Reporte enviado",
        description:
          "El informe de conciliación se ha encolado para su envío por correo.",
        variant: "success",
      });

      // Limpiar y cerrar
      setSelectedIds([]);
      setComentario("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error al enviar",
        description:
          error instanceof Error ? error.message : "No se pudo despachar el correo.",
        variant: "destructive",
      });
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (isSubmitting) return; // Bloquear cierre si está enviando
    onOpenChange(newOpen);
    if (!newOpen) {
      setSelectedIds([]);
      setComentario("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Enviar Informe de Conciliación
          </DialogTitle>
          <DialogDescription>
            Selecciona a los usuarios que deben recibir el reporte Excel de esta
            cuenta.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Destinatarios</Label>
            <SelectorDestinatarios
              value={selectedIds}
              onChange={setSelectedIds}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comentario">
              Comentario / Observaciones (Opcional)
            </Label>
            <Textarea
              id="comentario"
              placeholder="Escribe alguna nota adicional que aparecerá en el cuerpo del correo..."
              className="resize-none"
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Correo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
