import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conciliacionApi } from "@/lib/api/conciliacion";
import type { ActaDetalleResponse, EjecutarConciliacionPayload, MayorEditadoResponse, ResultadoConciliacionResponse } from "@/types/conciliacion";

export const conciliacionKeys = {
  all: ["conciliacion"] as const,
  mayorEditado: (idCuenta: string, fechaInicio: string, fechaFin: string) =>
    [...conciliacionKeys.all, "mayor-editado", idCuenta, fechaInicio, fechaFin] as const,
  actasAll: () => [...conciliacionKeys.all, "actas"] as const,
  actas: (limit: number, idCuenta?: string) => [...conciliacionKeys.all, "actas", limit, idCuenta ?? null] as const,
  actaDetalle: (idActa: string) => [...conciliacionKeys.all, "acta-detalle", idActa] as const,
  grupos: (idCuenta: string, fechaInicio: string, fechaFin: string) =>
    [...conciliacionKeys.all, "grupos", idCuenta, fechaInicio, fechaFin] as const,
};

/** Refresca todo lo que cambia tras conciliar, cerrar o reabrir. */
function useInvalidarConciliacion() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["bancos"] });
    queryClient.invalidateQueries({ queryKey: conciliacionKeys.all });
  };
}

export function useMayorEditado(idCuenta: string, fechaInicio: string, fechaFin: string, enabled = true) {
  return useQuery<MayorEditadoResponse, Error>({
    queryKey: conciliacionKeys.mayorEditado(idCuenta, fechaInicio, fechaFin),
    queryFn: () => conciliacionApi.getMayorEditado(idCuenta, fechaInicio, fechaFin),
    enabled: enabled && !!idCuenta && !!fechaInicio && !!fechaFin,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEjecutarAutoMatch() {
  const invalidar = useInvalidarConciliacion();
  return useMutation<ResultadoConciliacionResponse, Error, EjecutarConciliacionPayload>({
    mutationFn: (payload) => conciliacionApi.ejecutarMatch(payload),
    retry: false,
    onSuccess: invalidar,
  });
}

export function useActas(limit = 50, idCuenta?: string, enabled = true) {
  return useQuery<ResultadoConciliacionResponse[], Error>({
    queryKey: conciliacionKeys.actas(limit, idCuenta),
    queryFn: () => conciliacionApi.getActas(limit, idCuenta),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useActaDetalle(idActa: string | null | undefined, enabled = true) {
  return useQuery<ActaDetalleResponse, Error>({
    queryKey: conciliacionKeys.actaDetalle(idActa || ""),
    queryFn: () => conciliacionApi.getActaDetalle(idActa!),
    enabled: enabled && !!idActa,
    staleTime: 30 * 1000,
  });
}

export function useConciliados(idCuenta: string, fechaInicio: string, fechaFin: string, enabled = true) {
  return useQuery({
    queryKey: conciliacionKeys.grupos(idCuenta, fechaInicio, fechaFin),
    queryFn: () => conciliacionApi.getConciliados(idCuenta, fechaInicio, fechaFin),
    enabled: enabled && !!idCuenta && !!fechaInicio && !!fechaFin,
    staleTime: 30 * 1000,
  });
}

export function useCerrarActa() {
  const invalidar = useInvalidarConciliacion();
  return useMutation<ResultadoConciliacionResponse, Error, string>({
    mutationFn: (idActa) => conciliacionApi.cerrarActa(idActa),
    onSuccess: invalidar,
  });
}

export function useReabrirActa() {
  const invalidar = useInvalidarConciliacion();
  return useMutation<ResultadoConciliacionResponse, Error, string>({
    mutationFn: (idActa) => conciliacionApi.reabrirActa(idActa),
    onSuccess: invalidar,
  });
}

export function useEnviarReporteEmail() {
  return useMutation<{ status: string; message: string }, Error, { idActa: string; destinatarios: string[]; comentario?: string }>({
    mutationFn: ({ idActa, destinatarios, comentario }) =>
      conciliacionApi.enviarReporteEmail(idActa, { destinatarios, comentario }),
  });
}
