import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fmtDate, norm } from '@batak/shared';
import { useActivarEvento, useAddEvento, useDeleteEvento, useEventos } from '../hooks/batak';
import { useArmed } from '../hooks/useArmed';
import { useToast } from '../hooks/toast';

/** Hoy en YYYY-MM-DD y en hora local: toISOString() daría ayer por la tarde. */
function hoy(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function EventosPage() {
  const eventos = useEventos();
  const addEvento = useAddEvento();
  const activarEvento = useActivarEvento();
  const deleteEvento = useDeleteEvento();
  const { show } = useToast();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(hoy);

  const lista = eventos.data ?? [];

  const { armed, press } = useArmed((id) => {
    const evento = lista.find((e) => e.id === id);
    const partidas = evento?.partidas ?? 0;
    // Con partidas de por medio el borrado es en cascada, así que hay que
    // pedirlo explícitamente: el API rechaza el borrado silencioso.
    deleteEvento.mutate(
      { id, force: partidas > 0 },
      {
        onSuccess: ({ partidasBorradas }) =>
          show(
            partidasBorradas > 0
              ? `Evento borrado con sus ${partidasBorradas} ${partidasBorradas === 1 ? 'partida' : 'partidas'}`
              : 'Evento borrado',
          ),
        onError: (error) => show(`No se pudo borrar: ${error.message}`, true),
      },
    );
  });

  function create(event: FormEvent): void {
    event.preventDefault();
    const limpio = norm(nombre);
    if (!limpio || !fecha || addEvento.isPending) return;

    addEvento.mutate(
      { nombre: limpio, fecha },
      {
        onSuccess: () => {
          show('Evento creado y activado');
          setNombre('');
          // Recién creado el evento, lo siguiente es apuntar.
          void navigate('/apuntar');
        },
        onError: (error) => show(`No se pudo crear: ${error.message}`, true),
      },
    );
  }

  function activar(id: string): void {
    activarEvento.mutate(id, {
      onSuccess: () => show('Evento activado'),
      onError: (error) => show(`No se pudo activar: ${error.message}`, true),
    });
  }

  return (
    <section className="grid gap-5 pt-2">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="panel">
          <h3 className="panel-title">Nuevo evento</h3>
          <form onSubmit={create} className="grid gap-3.5">
            <div className="grid gap-1.5">
              <label htmlFor="bk-ev-name" className="label">
                Nombre de la feria o evento
              </label>
              <input
                id="bk-ev-name"
                type="text"
                maxLength={80}
                placeholder="p. ej. Feria Madrid 2026"
                className="field"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="bk-ev-date" className="label">
                Fecha
              </label>
              <input
                id="bk-ev-date"
                type="date"
                className="field"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="submit" className="btn-primary" disabled={addEvento.isPending}>
                Crear y activar
              </button>
            </div>
            <p className="hint">
              Cada feria tiene su propio ranking. Las puntuaciones que se apunten van siempre al
              evento activo.
            </p>
          </form>
        </div>

        <div className="panel">
          <h3 className="panel-title">Eventos</h3>
          {lista.length === 0 ? (
            <div className="hint">Aún no hay eventos. Crea el primero con el formulario.</div>
          ) : (
            <div className="grid gap-2">
              {lista.map((evento) => (
                <div
                  key={evento.id}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border bg-bg2 px-3.5 py-3 ${
                    evento.activo ? 'border-amber' : 'border-line'
                  }`}
                >
                  <Link to={`/eventos/${evento.id}`} className="min-w-0 no-underline">
                    <div className="font-display text-[22px] font-semibold [overflow-wrap:anywhere] hover:text-amber">
                      {evento.nombre}
                      {evento.activo && <span className="pill">Activo</span>}
                    </div>
                    <div className="text-[13px] text-fg2">
                      {fmtDate(evento.fecha)} · {evento.partidas ?? 0} partidas · ver ficha →
                    </div>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {!evento.activo && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => activar(evento.id)}
                      >
                        Activar
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => press(evento.id)}
                    >
                      {armed !== evento.id
                        ? 'Borrar'
                        : evento.partidas
                          ? `¿Borrar ${evento.partidas} partidas?`
                          : '¿Seguro?'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
