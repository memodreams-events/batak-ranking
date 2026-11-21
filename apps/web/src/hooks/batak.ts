import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { leaderboard, nombresConocidos } from '@batak/shared';
import type {
  BatakEstado,
  BatakEvento,
  BatakPuntuacion,
  PuntuacionCreada,
  RankRow,
} from '@batak/shared';
import { ApiError, apiFetch } from '../lib/api';
import { usePin } from './pin';

/** Cada cuánto vuelven a preguntar la TV del stand y el iPad. */
const POLL_MS = 4000;

const keys = {
  activo: ['batak', 'activo'] as const,
  eventos: ['batak', 'eventos'] as const,
  todas: ['batak', 'puntuaciones'] as const,
};

const EMPTY_ESTADO: BatakEstado = { evento: null, puntuaciones: [] };

export function useEstado() {
  return useQuery({
    queryKey: keys.activo,
    queryFn: () => apiFetch<BatakEstado>('/batak/activo'),
    refetchInterval: POLL_MS,
    // La TV se queda horas en la misma pestaña; sin esto deja de refrescarse
    // en cuanto el navegador considera que no está en primer plano.
    refetchIntervalInBackground: true,
  });
}

export function useEventos() {
  return useQuery({
    queryKey: keys.eventos,
    queryFn: () => apiFetch<BatakEvento[]>('/batak/eventos'),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
  });
}

export function useTodas() {
  return useQuery({
    queryKey: keys.todas,
    queryFn: () => apiFetch<BatakPuntuacion[]>('/batak/puntuaciones'),
  });
}

/** Estado del evento activo ya desmenuzado para las pantallas. */
export function useRanking(): {
  evento: BatakEvento | null;
  puntuaciones: BatakPuntuacion[];
  ranking: RankRow[];
  online: boolean;
} {
  const estado = useEstado();
  const { evento, puntuaciones } = estado.data ?? EMPTY_ESTADO;
  return {
    evento,
    puntuaciones,
    ranking: leaderboard(puntuaciones),
    // Solo un fallo de red cuenta como "sin conexión"; un 500 es otra cosa.
    online: !(estado.error instanceof ApiError && estado.error.status === 0),
  };
}

/** Nombres ya vistos, para el autocompletado del iPad. */
export function useNombresConocidos(): string[] {
  const { puntuaciones } = useRanking();
  const todas = useTodas();
  return nombresConocidos(puntuaciones, todas.data ?? []);
}

/**
 * Envoltorio de las escrituras: refresca lo que toque y, si el API responde
 * 401, marca que este dispositivo necesita volver a introducir el PIN.
 */
function useWrite<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
): UseMutationResult<TResult, Error, TArgs> {
  const queryClient = useQueryClient();
  const { markRejected } = usePin();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['batak'] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) markRejected();
    },
  });
}

export function useAddPuntuacion() {
  return useWrite(({ nombre, puntos }: { nombre: string; puntos: number }) =>
    apiFetch<PuntuacionCreada>('/batak/puntuaciones', {
      method: 'POST',
      body: { nombre, puntos },
      withPin: true,
    }),
  );
}

export function useDeletePuntuacion() {
  return useWrite((id: string) =>
    apiFetch<{ ok: true }>(`/batak/puntuaciones/${id}`, { method: 'DELETE', withPin: true }),
  );
}

export function useAddEvento() {
  return useWrite(({ nombre, fecha }: { nombre: string; fecha: string }) =>
    apiFetch<BatakEvento>('/batak/eventos', {
      method: 'POST',
      body: { nombre, fecha },
      withPin: true,
    }),
  );
}

export function useActivarEvento() {
  return useWrite((id: string) =>
    apiFetch<BatakEvento>(`/batak/eventos/${id}/activar`, { method: 'PATCH', withPin: true }),
  );
}

/** `force` arrastra también las partidas del evento; sin él, el API responde 409. */
export function useDeleteEvento() {
  return useWrite(({ id, force = false }: { id: string; force?: boolean }) =>
    apiFetch<{ ok: true; partidasBorradas: number }>(
      `/batak/eventos/${id}${force ? '?force=true' : ''}`,
      { method: 'DELETE', withPin: true },
    ),
  );
}
