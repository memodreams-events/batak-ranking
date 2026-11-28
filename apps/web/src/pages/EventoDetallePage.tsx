import { Link, useParams } from 'react-router-dom';
import { estadisticasDeEvento, fmtDate, leaderboard, num } from '@batak/shared';
import { useDetalleEvento } from '../hooks/batak';
import { BarChart } from '../components/BarChart';
import { RankListBuscable } from '../components/RankListBuscable';
import { downloadText, puntuacionesToCsv } from '../lib/csv';

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-[10px] bg-bg2 px-3.5 py-3">
      <b className="block font-display text-3xl font-bold leading-none tabular-nums">{valor}</b>
      <span className="label">{etiqueta}</span>
    </div>
  );
}

export function EventoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const detalle = useDetalleEvento(id);

  if (detalle.isLoading) {
    return (
      <section className="py-10 text-center text-fg2">
        <p className="label">Cargando la ficha…</p>
      </section>
    );
  }

  if (detalle.isError || !detalle.data) {
    return (
      <section className="panel mt-4">
        <h3 className="panel-title">No se pudo cargar el evento</h3>
        <p className="hint">{(detalle.error as Error)?.message ?? 'Inténtalo de nuevo.'}</p>
        <Link to="/eventos" className="btn mt-3 inline-flex">
          Volver a eventos
        </Link>
      </section>
    );
  }

  const { evento, puntuaciones, visitas } = detalle.data;
  const stats = estadisticasDeEvento(puntuaciones);
  const ranking = leaderboard(puntuaciones);

  function exportCsv(): void {
    const nombre = evento.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadText(`batak-${nombre}.csv`, puntuacionesToCsv(puntuaciones), 'text/csv;charset=utf-8');
  }

  return (
    <section className="grid gap-5 pt-2">
      <div className="flex flex-wrap items-start justify-between gap-3 print:block">
        <div>
          <Link to="/eventos" className="hint underline print:hidden">
            Volver a eventos
          </Link>
          <h2 className="mt-1 font-display text-[28px] font-semibold">
            {evento.nombre}
            {evento.activo && <span className="pill">Activo</span>}
          </h2>
          <p className="hint">
            {fmtDate(evento.fecha)}
            {stats.partidas > 0 && `, de ${stats.inicio} a ${stats.fin}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 print:hidden">
          <button type="button" className="btn" onClick={() => window.print()}>
            Descargar PDF
          </button>
          <button type="button" className="btn" onClick={exportCsv} disabled={!puntuaciones.length}>
            Exportar CSV
          </button>
        </div>
      </div>

      {stats.partidas === 0 ? (
        <div className="panel">
          <p className="hint">Este evento todavía no tiene ninguna partida apuntada.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            <Dato valor={num(stats.jugadores)} etiqueta="Jugadores" />
            <Dato valor={num(stats.partidas)} etiqueta="Partidas" />
            <Dato valor={num(stats.puntosMax)} etiqueta="Récord" />
            <Dato valor={String(stats.puntosMedia)} etiqueta="Media" />
            <Dato valor={num(visitas)} etiqueta="Aperturas QR" />
          </div>

          <div className="panel">
            <h3 className="panel-title">Afluencia por hora</h3>
            <p className="hint mb-3">Partidas jugadas en cada franja horaria.</p>
            <BarChart
              titulo="Partidas por hora"
              datos={stats.horas.map((h) => ({ etiqueta: `${h.hora}h`, valor: h.partidas }))}
            />
          </div>

          <div className="panel">
            <h3 className="panel-title">Distribución de puntuaciones</h3>
            <p className="hint mb-3">Número de partidas en cada tramo.</p>
            <BarChart
              titulo="Partidas por tramo de puntuación"
              datos={stats.tramos.map((t) => ({ etiqueta: t.etiqueta, valor: t.partidas }))}
            />
          </div>

          <div className="panel">
            <h3 className="panel-title">Participación</h3>
            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              <Linea k="Media de partidas por jugador" v={String(stats.media)} />
              <Linea
                k="Jugaron una sola vez"
                v={`${num(stats.unaVez)} (${Math.round((stats.unaVez / stats.jugadores) * 100)} %)`}
              />
              <Linea
                k="Repitieron"
                v={`${num(stats.repiten)} (${Math.round((stats.repiten / stats.jugadores) * 100)} %)`}
              />
              <Linea k="Máximo de intentos" v={`${stats.maxIntentos} partidas`} />
              <Linea
                k="Puntuación mínima / mediana"
                v={`${stats.puntosMin} / ${stats.puntosMediana}`}
              />
              <Linea
                k="Identificados con apellidos"
                v={`${num(stats.conApellidos)} de ${num(stats.jugadores)}`}
              />
              <Linea k="Aperturas de la pantalla del QR" v={num(visitas)} />
            </div>
            <p className="hint mt-3">
              Las aperturas del QR cuentan veces que se abrió la pantalla desde un navegador, no
              personas: quien la abre dos días distintos cuenta dos veces.
            </p>
          </div>

          <div className="panel">
            <h3 className="panel-title">Clasificación</h3>
            <RankListBuscable
              rows={ranking}
              limit={50}
              id="buscar-evento"
              emptyTitle="Sin puntuaciones"
            />
          </div>
        </>
      )}
    </section>
  );
}

function Linea({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-1.5">
      <span className="hint">{k}</span>
      <span className="font-semibold tabular-nums">{v}</span>
    </div>
  );
}
