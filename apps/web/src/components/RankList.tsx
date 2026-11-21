import { fmtTime, num } from '@batak/shared';
import type { RankRow } from '@batak/shared';

interface RankListProps {
  rows: RankRow[];
  limit?: number;
  /** En el histórico cada fila viene de un evento distinto y conviene decir cuál. */
  showEvent?: boolean;
  /** Resalta la partida recién apuntada desde este dispositivo. */
  highlightId?: string | null;
  emptyTitle?: string;
  emptyText?: string;
  /** Modo TV: todo más grande para leerlo desde el pasillo. */
  screen?: boolean;
}

/** Posiciones de podio: oro, plata y bronce. El resto va en gris. */
const PODIUM = ['text-amber', 'text-silver', 'text-bronze'];

function meta(row: RankRow, showEvent: boolean): string {
  const parts: string[] = [];
  if (showEvent && row.eventoNombre) parts.push(row.eventoNombre);
  if (row.intentos > 1) parts.push(`${row.intentos} intentos`);
  if (row.createdAt && !showEvent) parts.push(fmtTime(row.createdAt));
  return parts.join(' · ');
}

export function RankList({
  rows,
  limit = 20,
  showEvent = false,
  highlightId = null,
  emptyTitle = 'Sin puntuaciones',
  emptyText = '',
  screen = false,
}: RankListProps) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-9 text-center text-fg2">
        <strong className="mb-1.5 block font-display text-2xl text-fg">{emptyTitle}</strong>
        <span>{emptyText}</span>
      </div>
    );
  }

  return (
    <div className="grid gap-1.5">
      {rows.slice(0, limit).map((row, index) => {
        const podium = PODIUM[index] ?? 'text-fg2';
        return (
          <div
            key={row.nombre}
            className={[
              'grid items-center gap-3.5 rounded-[10px] border bg-bg2',
              screen
                ? 'grid-cols-[80px_minmax(0,1fr)_auto] px-[22px] py-4'
                : 'grid-cols-[56px_minmax(0,1fr)_auto] px-3.5 py-2.5',
              index === 0
                ? 'border-amber bg-gradient-to-r from-amber/20 to-bg2 to-60%'
                : 'border-transparent',
              row.puntuacionId === highlightId ? 'animate-flash motion-reduce:animate-none' : '',
            ].join(' ')}
          >
            <div
              className={`font-display font-bold tabular-nums ${podium} ${screen ? 'text-[44px]' : 'text-[28px]'}`}
            >
              {index + 1}
            </div>
            <div className="min-w-0">
              <div
                className={`font-medium [overflow-wrap:anywhere] ${screen ? 'text-[32px]' : 'text-xl'}`}
              >
                {row.nombre}
              </div>
              {meta(row, showEvent) && (
                <div className="text-[13px] text-fg2">{meta(row, showEvent)}</div>
              )}
            </div>
            <div
              className={`font-display font-bold tabular-nums ${index < 3 ? podium : ''} ${screen ? 'text-[52px]' : 'text-[32px]'}`}
            >
              {num(row.puntos)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
