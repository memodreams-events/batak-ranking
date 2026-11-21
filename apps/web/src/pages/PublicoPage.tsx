import { fmtDate, num } from '@batak/shared';
import { useRanking } from '../hooks/batak';
import { Logo } from '../components/Logo';
import { RankList } from '../components/RankList';

/**
 * Vista para los participantes, pensada para el móvil.
 *
 * Es la única página sin barra de navegación: quien llega aquí viene del QR
 * del stand y no tiene por qué ver (ni tocar) Apuntar, Eventos o Histórico.
 * Solo lee, así que tampoco pasa por el PIN.
 */
export function PublicoPage() {
  const { evento, puntuaciones, ranking, online } = useRanking();

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
                  i % 2 === 0 ? 'bg-amber shadow-[0_0_6px_#ffb627]' : 'bg-line'
                }`}
              />
            ))}
          </span>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
            Batak <span className="text-amber">Ranking</span>
          </h1>
        </div>
      </header>

      <div className="border-y border-line py-3 text-center">
        <div className="label">{evento ? 'Clasificación' : 'Evento'}</div>
        <h2
          className={`font-display text-2xl ${evento ? 'font-semibold' : 'font-medium text-fg2'}`}
        >
          {evento ? evento.nombre : 'Sin evento activo'}
        </h2>
        {evento && (
          <p className="mt-0.5 text-[13px] text-fg2">
            {fmtDate(evento.fecha)}
            {puntuaciones.length > 0 && (
              <>
                {' · '}
                {num(ranking.length)} {ranking.length === 1 ? 'jugador' : 'jugadores'}
                {' · '}
                {num(puntuaciones.length)} {puntuaciones.length === 1 ? 'partida' : 'partidas'}
              </>
            )}
          </p>
        )}
      </div>

      <main className="flex-1 py-5">
        <RankList
          rows={ranking}
          limit={50}
          emptyTitle={evento ? 'Aún no hay puntuaciones' : 'No hay ningún evento activo'}
          emptyText={
            evento
              ? '¡Sé el primero en jugar y aparecer aquí!'
              : 'Pregunta en el stand para empezar a jugar.'
          }
        />
      </main>

      <footer className="pb-7 text-center text-[13px] text-fg2">
        {online ? (
          <p>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-ok align-middle shadow-[0_0_6px_#4ad67f]" />
            Se actualiza solo. Deja esta página abierta y verás tu puntuación al instante.
          </p>
        ) : (
          <p className="text-bad">Sin conexión. Comprueba tu cobertura.</p>
        )}
      </footer>
    </div>
  );
}
