import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { conciliacionApi, ActaDetalleResponse } from "@/lib/api/conciliacion";
import {
  EjecutarConciliacionPayload,
  ResultadoConciliacionResponse,
  MayorEditadoResponse, // <-- 1. Importación agregada
} from "@/types";

export const conciliacionKeys = {
  all: ["conciliacion"] as const,
  mayorEditado: (
    fechaInicio: string,
    fechaFin: string,
    cuentaContable: string,
  ) =>
    [
      ...conciliacionKeys.all,
      "mayor-editado",
      fechaInicio,
      fechaFin,
      cuentaContable,
    ] as const,
  actas: (limit?: number) => [...conciliacionKeys.all, "actas", limit] as const,
  actaDetalle: (idActa: string) =>
    [...conciliacionKeys.all, "actas", "detalle", idActa] as const,
};

export function useMayorEditado(
  fechaInicio: string,
  fechaFin: string,
  cuentaContable: string,
  enabled = true,
  options?: UseQueryOptions<MayorEditadoResponse, Error>, // <-- 2. Tipo de respuesta actualizado
) {
  return useQuery({
    queryKey: conciliacionKeys.mayorEditado(
      fechaInicio,
      fechaFin,
      cuentaContable,
    ),
    queryFn: () =>
      conciliacionApi.getMayorEditado(fechaInicio, fechaFin, cuentaContable),
    enabled: enabled && !!fechaInicio && !!fechaFin && !!cuentaContable,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useEjecutarAutoMatch(
  options?: UseMutationOptions<
    ResultadoConciliacionResponse,
    Error,
    {
      payload: EjecutarConciliacionPayload;
      fechaInicio: string;
      fechaFin: string;
    }
  >,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};

  return useMutation({
    mutationFn: ({ payload, fechaInicio, fechaFin }) =>
      conciliacionApi.ejecutarMatch({
        ...payload,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      }),
    retry: false, // Desactiva reintentos automáticos en ejecuciones pesadas que expiren
    onSuccess: (data, variables, context) => {
      // Invalida la caché para refrescar movimientos bancarios, mayor contable y actas
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      queryClient.invalidateQueries({ queryKey: conciliacionKeys.all });

      if (onSuccess) {
        (onSuccess as Function)(data, variables, context);
      }
    },
    ...restOptions,
  });
}

export function useActas(
  limit = 50,
  options?: UseQueryOptions<ResultadoConciliacionResponse[], Error>,
) {
  return useQuery({
    queryKey: conciliacionKeys.actas(limit),
    queryFn: () => conciliacionApi.getActas(limit),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useActaDetalle(
  idActa: string,
  enabled = true,
  options?: UseQueryOptions<ActaDetalleResponse, Error>,
) {
  return useQuery({
    queryKey: conciliacionKeys.actaDetalle(idActa),
    queryFn: () => conciliacionApi.getActaDetalle(idActa),
    enabled: enabled && !!idActa,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useConciliados(
  idCuenta: string,
  fechaInicio: string,
  fechaFin: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["conciliacion", "grupos", idCuenta, fechaInicio, fechaFin],
    queryFn: () =>
      conciliacionApi.getConciliados(idCuenta, fechaInicio, fechaFin),
    enabled: enabled && !!idCuenta && !!fechaInicio && !!fechaFin,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useEnviarReporteEmail(
  options?: UseMutationOptions<
    any,
    Error,
    { idActa: string; destinatarios: string[]; comentario?: string }
  >,
) {
  return useMutation({
    mutationFn: ({ idActa, destinatarios, comentario }) =>
      conciliacionApi.enviarReporteEmail(idActa, { destinatarios, comentario }),
    ...options,
  });
}
