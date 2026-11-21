import { useNavigate, useOutletContext } from 'react-router-dom';
import { useRanking } from '../hooks/batak';
import { RankList } from '../components/RankList';

interface LayoutContext {
  screen: boolean;
}

export function RankingPage() {
  const { evento, puntuaciones, ranking } = useRanking();
  const { screen } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

  const subtitle = puntuaciones.length
    ? `${puntuaciones.length} partidas · ${ranking.length} jugadores`
    : '';

  function bigScreen(): void {
    void navigate('/pantalla');
    // Las dos fallan si el navegador no las soporta o no hay gesto de usuario
    // detrás; la pantalla funciona igual, solo que con cromo y apagándose.
    try {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    } catch {
      /* sin pantalla completa */
    }
    try {
      void (
        navigator as unknown as { wakeLock?: { request(type: string): Promise<unknown> } }
      ).wakeLock
        ?.request('screen')
        .catch(() => undefined);
    } catch {
      /* sin wake lock: la TV puede apagarse sola */
    }
  }

  return (
    <section className="grid gap-5 pt-2">
      <div className={screen ? '' : 'panel'}>
        {!screen && (
          <h3 className="panel-title">
            Clasificación <span className="hint font-sans font-normal">{subtitle}</span>
          </h3>
        )}
        <RankList
          rows={ranking}
          limit={20}
          screen={screen}
          emptyTitle={evento ? 'Todavía no hay puntuaciones' : 'No hay ningún evento activo'}
          emptyText={
            evento
              ? 'Apunta la primera partida en la pestaña Apuntar.'
              : 'Crea o activa un evento en la pestaña Eventos.'
          }
        />
      </div>

      {!screen && (
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" className="btn" onClick={bigScreen}>
            Modo pantalla grande
          </button>
          <span className="hint">
            Para la TV del stand: oculta los controles y amplía el ranking. Se actualiza solo cada
            pocos segundos.
          </span>
        </div>
      )}
    </section>
  );
}
