import { useEffect } from 'react';
import { fmtDate, num } from '@batak/shared';
import { useRanking } from '../hooks/batak';
import { registrarVisita } from '../lib/api';
import { Logo } from '../components/Logo';
import { RankListBuscable } from '../components/RankListBuscable';

/**
 * Vista para los participantes, pensada para el móvil.
 *
 * Es la única página sin barra de navegación: quien llega aquí viene del QR
 * del stand y no tiene por qué ver (ni tocar) Apuntar, Eventos o Histórico.
 * Solo lee, así que tampoco pasa por el PIN.
 */
export function PublicoPage() {
  const { evento, puntuaciones, ranking, online } = useRanking();

  // Telemetría interna: cuántas veces se abre la pantalla del QR.
  useEffect(() => {
    void registrarVisita();
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4">
      <header className="flex flex-col items-center gap-3 pb-5 pt-7">
        <Logo className="h-11" />
        <div className="flex items-center gap-2">
          <span className="grid grid-cols-3 gap-1" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <i
                key={i}
                className={`block h-1.5 w-1.5 rounded-full ${
                  i % 2 === 0 ? 'bg-brasa shadow-light' : 'bg-line'
                }`}
              />
            ))}
          </span>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
            Batak <span className="text-brasa-text">Ranking</span>
          </h1>
        </div>
      </header>

      <div className="border-y border-line py-3 text-center">
        <h2
          className={`font-display text-2xl ${evento ? 'font-semibold' : 'font-medium text-fg2'}`}
        >
          {evento ? evento.nombre : 'Sin evento activo'}
        </h2>
        {evento && (
          <p className="mt-0.5 flex flex-wrap justify-center gap-x-3 text-sm text-fg2">
            <span>{fmtDate(evento.fecha)}</span>
            {puntuaciones.length > 0 && (
              <>
                <span>
                  {num(ranking.length)} {ranking.length === 1 ? 'jugador' : 'jugadores'}
                </span>
                <span>
                  {num(puntuaciones.length)} {puntuaciones.length === 1 ? 'partida' : 'partidas'}
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <main className="flex-1 py-5">
        <div className="panel">
          <RankListBuscable
            rows={ranking}
            limit={50}
            id="buscar-publico"
            placeholder="Busca tu nombre"
            emptyTitle={evento ? 'Aún no hay puntuaciones' : 'No hay ningún evento activo'}
            emptyText={
              evento
                ? '¡Sé el primero en jugar y aparecer aquí!'
                : 'Pregunta en el stand para empezar a jugar.'
            }
          />
        </div>
      </main>

      <footer className="pb-7 text-center text-sm text-fg2">
        {online ? (
          <p>
            <span className="font-medium text-ok">Se actualiza solo.</span> Deja esta página abierta y verás tu puntuación al instante.
          </p>
        ) : (
          <p className="text-bad">Sin conexión. Comprueba tu cobertura.</p>
        )}
      </footer>
    </div>
  );
}
