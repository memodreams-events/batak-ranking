import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { fmtTime, nombreCompleto, norm, num } from '@batak/shared';
import {
  useAddPuntuacion,
  useDeletePuntuacion,
  useRanking,
  useValoresConocidos,
} from '../hooks/batak';
import { useArmed } from '../hooks/useArmed';
import { useToast } from '../hooks/toast';

export function ApuntarPage() {
  const { evento, puntuaciones } = useRanking();
  const nombres = useValoresConocidos('nombre');
  const apellidosConocidos = useValoresConocidos('apellidos');
  const addPuntuacion = useAddPuntuacion();
  const deletePuntuacion = useDeletePuntuacion();
  const { show } = useToast();

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [puntos, setPuntos] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);

  const saving = addPuntuacion.isPending;
  const canSave = Boolean(evento) && !saving;
  const recent = puntuaciones.slice(0, 15);

  const { armed, press } = useArmed((id) => {
    deletePuntuacion.mutate(id, {
      onSuccess: () => show('Partida borrada'),
      onError: (error) => show(`No se pudo borrar: ${error.message}`, true),
    });
  });

  async function save(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canSave) return;

    const limpio = norm(nombre);
    const limpioApellidos = norm(apellidos);
    const valor = Math.round(Number(puntos));
    if (!limpio) return show('Escribe un nombre', true);
    // Sin apellidos, dos jugadores que se llamen igual comparten fila en la
    // clasificación y uno de los dos pierde su marca.
    if (!limpioApellidos) return show('Escribe los apellidos', true);
    // Number('') es 0, así que hay que comprobar el campo vacío aparte.
    if (puntos.trim() === '' || !Number.isFinite(valor) || valor < 0) {
      return show('La puntuación debe ser un número', true);
    }

    addPuntuacion.mutate(
      { nombre: limpio, apellidos: limpioApellidos, puntos: valor },
      {
        onSuccess: ({ puesto }) => {
          show(
            `${nombreCompleto({ nombre: limpio, apellidos: limpioApellidos })}: ${num(valor)} puntos` +
              (puesto ? `, puesto ${puesto}` : ' (no mejora su récord)'),
          );
          setNombre('');
          setApellidos('');
          setPuntos('');
          nameInput.current?.focus();
        },
        onError: (error) => show(`No se pudo guardar: ${error.message}`, true),
      },
    );
  }

  return (
    <section className="grid gap-5 pt-2">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="panel">
          <h3 className="panel-title">Nueva puntuación</h3>
          <form onSubmit={save} autoComplete="off" className="grid gap-3.5">
            <div className="grid gap-1.5">
              <label htmlFor="bk-name" className="label">
                Nombre
              </label>
              <input
                ref={nameInput}
                id="bk-name"
                type="text"
                list="bk-names"
                maxLength={60}
                placeholder="Nombre del jugador"
                className="field"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                required
              />
              <datalist id="bk-names">
                {nombres.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="bk-surname" className="label">
                Apellidos
              </label>
              <input
                id="bk-surname"
                type="text"
                list="bk-surnames"
                maxLength={80}
                placeholder="Apellidos del jugador"
                className="field"
                value={apellidos}
                onChange={(event) => setApellidos(event.target.value)}
                required
              />
              <datalist id="bk-surnames">
                {apellidosConocidos.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="bk-score" className="label">
                Puntuación
              </label>
              <input
                id="bk-score"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="0"
                className="field-number"
                value={puntos}
                onChange={(event) => setPuntos(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="submit" className="btn-primary" disabled={!canSave}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              {!evento && <span className="hint">Activa un evento antes de apuntar.</span>}
            </div>
          </form>
        </div>

        <div className="panel">
          <h3 className="panel-title">Últimas partidas</h3>
          {recent.length === 0 ? (
            <div className="hint">Aquí aparecerán las últimas partidas apuntadas.</div>
          ) : (
            <div className="grid">
              {recent.map((partida) => (
                <div
                  key={partida.id}
                  className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 border-b border-line px-2.5 py-2 text-base last:border-b-0`}
                >
                  <div className="min-w-0 [overflow-wrap:anywhere]">
                    {nombreCompleto(partida)}
                    <span className="ml-1.5 text-sm text-fg2">
                      {fmtTime(partida.createdAt)}
                    </span>
                  </div>
                  <div className="font-display text-[22px] font-bold tabular-nums">
                    {num(partida.puntos)}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => press(partida.id)}
                  >
                    {armed === partida.id ? '¿Seguro?' : 'Borrar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
