import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { leaderboard, num } from '@batak/shared';
import { useEventos, useImportar, useTodas } from '../hooks/batak';
import { useToast } from '../hooks/toast';
import { RankListBuscable } from '../components/RankListBuscable';
import { downloadText, puntuacionesToCsv } from '../lib/csv';
import { parsearCsv } from '../lib/csv-import';
import type { ResultadoParseo } from '../lib/csv-import';

export function HistoricoPage() {
  const eventos = useEventos();
  const todas = useTodas();
  const importar = useImportar();
  const { show } = useToast();

  const fileInput = useRef<HTMLInputElement>(null);
  // Nada se envía hasta que se confirma: primero se enseña qué trae el fichero.
  const [previo, setPrevio] = useState<ResultadoParseo | null>(null);

  async function onFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const resultado = parsearCsv(await file.text());
    if (resultado.filas.length === 0) {
      show(resultado.errores[0] ?? 'El fichero no tiene partidas que importar.', true);
      return;
    }
    setPrevio(resultado);
  }

  function confirmarImportacion(): void {
    if (!previo) return;
    importar.mutate(previo.filas, {
      onSuccess: ({ eventosCreados, partidasImportadas }) => {
        show(
          `Importadas ${partidasImportadas} partidas` +
            (eventosCreados ? ` y creados ${eventosCreados} eventos` : ''),
        );
        setPrevio(null);
      },
      onError: (error) => show(`No se pudo importar: ${error.message}`, true),
    });
  }

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
        <RankListBuscable
          rows={ranking}
          limit={30}
          showEvent
          id="buscar-historico"
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
          descargar todas las partidas en CSV para abrirlas en Excel, o cargar un histórico que ya
          tengas.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          <button type="button" className="btn" onClick={exportCsv} disabled={!partidas.length}>
            Exportar CSV
          </button>
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            Importar CSV
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onFile}
          />
        </div>

        {previo && (
          <div className="mt-4 rounded-[10px] border border-dashed border-amber p-3.5">
            <p className="font-display text-xl font-semibold">
              {num(previo.filas.length)} partidas listas para importar
            </p>
            {previo.eventos.length > 0 && (
              <p className="hint mt-1">
                Eventos en el fichero: {previo.eventos.join(', ')}. Los que no existan se crearán
                desactivados, así que el evento activo no cambia.
              </p>
            )}
            {previo.eventos.length === 0 && (
              <p className="hint mt-1">
                El fichero no indica evento, así que todas las partidas irán al evento activo.
              </p>
            )}
            {previo.errores.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-bad">
                  {previo.errores.length} filas con problemas (se saltarán)
                </summary>
                <ul className="mt-1 max-h-40 overflow-y-auto text-[13px] text-fg2">
                  {previo.errores.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
            <p className="hint mt-2">
              Importar dos veces el mismo fichero duplica las partidas: no hay forma de saber si una
              repetición es un error o alguien que jugó dos veces igual.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                className="btn-primary"
                onClick={confirmarImportacion}
                disabled={importar.isPending}
              >
                {importar.isPending ? 'Importando…' : 'Confirmar importación'}
              </button>
              <button type="button" className="btn" onClick={() => setPrevio(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
