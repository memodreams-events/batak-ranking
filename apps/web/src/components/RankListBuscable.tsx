import { useMemo, useState } from 'react';
import { coincideJugador, num } from '@batak/shared';
import type { RankRow } from '@batak/shared';
import { RankList } from './RankList';

interface RankListBuscableProps {
  rows: RankRow[];
  limit?: number;
  showEvent?: boolean;
  emptyTitle?: string;
  emptyText?: string;
  placeholder?: string;
  /** Id para el label del buscador: en una página puede haber más de una lista. */
  id?: string;
}

/**
 * Clasificación con buscador por jugador.
 *
 * Nace de una necesidad concreta del stand: con 56 jugadores en el histórico,
 * localizar a alguien a ojo es inviable, y el participante que abre el QR
 * quiere saber en qué puesto va él, no leerse la tabla entera.
 *
 * El filtro no renumera: quien va séptimo sigue viendo un 7. Para eso le pasa
 * a RankList el puesto calculado sobre la lista completa.
 */
export function RankListBuscable({
  rows,
  limit = 50,
  showEvent = false,
  emptyTitle = 'Sin puntuaciones',
  emptyText = '',
  placeholder = 'Buscar por nombre o apellidos',
  id = 'buscar-jugador',
}: RankListBuscableProps) {
  const [consulta, setConsulta] = useState('');

  // El puesto se fija sobre la lista completa, antes de filtrar.
  const puestos = useMemo(() => {
    const mapa = new Map<string, number>();
    rows.forEach((row, i) => mapa.set(row.puntuacionId, i + 1));
    return mapa;
  }, [rows]);

  const filtradas = useMemo(
    () => (consulta.trim() ? rows.filter((row) => coincideJugador(row, consulta)) : rows),
    [rows, consulta],
  );

  const buscando = consulta.trim().length > 0;

  return (
    <div className="grid gap-3">
      {rows.length > 0 && (
        <div className="relative">
          <label htmlFor={id} className="sr-only">
            Buscar jugador
          </label>
          <input
            id={id}
            type="search"
            inputMode="search"
            autoComplete="off"
            className="field pr-24"
            placeholder={placeholder}
            value={consulta}
            onChange={(event) => setConsulta(event.target.value)}
          />
          {buscando && (
            <button
              type="button"
              onClick={() => setConsulta('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg2 underline hover:text-fg"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {buscando && (
        <p className="hint">
          {filtradas.length === 0
            ? `Ningún jugador coincide con "${consulta.trim()}"`
            : `${num(filtradas.length)} de ${num(rows.length)} jugadores`}
        </p>
      )}

      <RankList
        rows={filtradas}
        // Al buscar no se recorta: si alguien va el 40º y lo buscas, tiene que salir.
        limit={buscando ? filtradas.length : limit}
        showEvent={showEvent}
        puestoDeFila={(row) => puestos.get(row.puntuacionId) ?? 0}
        emptyTitle={buscando ? 'Sin resultados' : emptyTitle}
        emptyText={buscando ? 'Prueba con menos letras o revisa cómo se apuntó.' : emptyText}
      />
    </div>
  );
}
