import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { leaderboard, valoresConocidos } from '@batak/shared';
import type {
  BatakEstado,
  BatakEvento,
  BatakPuntuacion,
  PuntuacionCreada,
  RankRow,
} from '@batak/shared';
import { ApiError, apiFetch } from '../lib/api';

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
    // Única ruta pública: la usa la pantalla del QR, sin sesión.
    queryFn: () => apiFetch<BatakEstado>('/batak/activo', { anonymous: true }),
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

/** Valores ya vistos de un campo, para el autocompletado del iPad. */
export function useValoresConocidos(campo: 'nombre' | 'apellidos'): string[] {
  const { puntuaciones } = useRanking();
  const todas = useTodas();
  return valoresConocidos(campo, puntuaciones, todas.data ?? []);
}

/** Envoltorio de las escrituras: al terminar, refresca lo que toque. */
function useWrite<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
): UseMutationResult<TResult, Error, TArgs> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['batak'] });
    },
  });
}

export function useAddPuntuacion() {
  return useWrite(
    ({ nombre, apellidos, puntos }: { nombre: string; apellidos: string; puntos: number }) =>
      apiFetch<PuntuacionCreada>('/batak/puntuaciones', {
        method: 'POST',
        body: { nombre, apellidos, puntos },
      }),
  );
}

export function useDeletePuntuacion() {
  return useWrite((id: string) =>
    apiFetch<{ ok: true }>(`/batak/puntuaciones/${id}`, { method: 'DELETE' }),
  );
}

export function useAddEvento() {
  return useWrite(({ nombre, fecha }: { nombre: string; fecha: string }) =>
    apiFetch<BatakEvento>('/batak/eventos', {
      method: 'POST',
      body: { nombre, fecha },
    }),
  );
}

export function useActivarEvento() {
  return useWrite((id: string) =>
    apiFetch<BatakEvento>(`/batak/eventos/${id}/activar`, { method: 'PATCH' }),
  );
}

/** `force` arrastra también las partidas del evento; sin él, el API responde 409. */
/** Carga masiva de un histórico ya parseado en el navegador. */
export function useImportar() {
  return useWrite((filas: unknown[]) =>
    apiFetch<{ eventosCreados: number; partidasImportadas: number }>('/batak/importar', {
      method: 'POST',
      body: { filas },
    }),
  );
}

export function useDeleteEvento() {
  return useWrite(({ id, force = false }: { id: string; force?: boolean }) =>
    apiFetch<{ ok: true; partidasBorradas: number }>(
      `/batak/eventos/${id}${force ? '?force=true' : ''}`,
      { method: 'DELETE' },
    ),
  );
}
