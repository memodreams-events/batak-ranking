import { leaderboard, num } from '@batak/shared';
import { useEventos, useTodas } from '../hooks/batak';
import { RankList } from '../components/RankList';
import { downloadText, puntuacionesToCsv } from '../lib/csv';

export function HistoricoPage() {
  const eventos = useEventos();
  const todas = useTodas();

  const partidas = todas.data ?? [];
  const ranking = leaderboard(partidas);

  const stats = [
    { label: 'Eventos', value: String(eventos.data?.length ?? 0) },
    { label: 'Partidas', value: String(partidas.length) },
    { label: 'Récord', value: ranking.length ? num(ranking[0].puntos) : '—' },
  ];

  function exportCsv(): void {
    downloadText('batak-puntuaciones.csv', puntuacionesToCsv(partidas), 'text/csv;charset=utf-8');
  }

  return (
    <section className="grid gap-5 pt-2">
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[10px] bg-bg2 px-3.5 py-3">
            <b className="block font-display text-3xl font-bold leading-none tabular-nums">
              {stat.value}
            </b>
            <span className="label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3 className="panel-title">Mejores puntuaciones de todos los eventos</h3>
        <RankList
          rows={ranking}
          limit={30}
          showEvent
          emptyTitle={todas.isLoading ? 'Cargando…' : 'Sin puntuaciones todavía'}
          emptyText={
            todas.isLoading
              ? ''
              : 'El histórico se llena a medida que apuntas partidas en los eventos.'
          }
        />
      </div>

      <div className="panel">
        <h3 className="panel-title">Datos</h3>
        <p className="hint">
          Las puntuaciones se guardan en el servidor y las ven todos los dispositivos. Puedes
          descargar todas las partidas en CSV para abrirlas en Excel.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          <button type="button" className="btn" onClick={exportCsv} disabled={!partidas.length}>
            Exportar CSV
          </button>
        </div>
      </div>
    </section>
  );
}
