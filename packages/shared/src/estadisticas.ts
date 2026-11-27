import { leaderboard } from './ranking';
import type { BatakPuntuacion } from './types';

export interface TramoPuntuacion {
  /** Límite inferior del tramo: 10 significa "10 a 19". */
  desde: number;
  etiqueta: string;
  partidas: number;
}

export interface FranjaHoraria {
  hora: number;
  partidas: number;
}

export interface EstadisticasEvento {
  partidas: number;
  jugadores: number;
  /** Partidas por jugador. */
  media: number;
  unaVez: number;
  repiten: number;
  maxIntentos: number;
  conApellidos: number;
  puntosMax: number;
  puntosMin: number;
  puntosMedia: number;
  puntosMediana: number;
  horas: FranjaHoraria[];
  tramos: TramoPuntuacion[];
  /** Primera y última partida, en hora local del navegador. 'HH:MM'. */
  inicio: string;
  fin: string;
}

const VACIO: EstadisticasEvento = {
  partidas: 0, jugadores: 0, media: 0, unaVez: 0, repiten: 0, maxIntentos: 0,
  conApellidos: 0, puntosMax: 0, puntosMin: 0, puntosMedia: 0, puntosMediana: 0,
  horas: [], tramos: [], inicio: '', fin: '',
};

const hhmm = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Resumen de un evento a partir de sus partidas.
 *
 * Las horas salen en la zona del navegador, que para el stand es la correcta.
 * Calcularlas sobre el ISO en crudo daría la hora UTC, una hora menos en
 * invierno: suficiente para mover el pico de afluencia de sitio.
 */
export function estadisticasDeEvento(puntuaciones: BatakPuntuacion[]): EstadisticasEvento {
  if (puntuaciones.length === 0) return { ...VACIO };

  const tabla = leaderboard(puntuaciones);
  const puntos = puntuaciones.map((p) => p.puntos).sort((a, b) => a - b);
  const ordenadas = [...puntuaciones].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const porHora = new Map<number, number>();
  for (const p of puntuaciones) {
    const h = new Date(p.createdAt).getHours();
    if (!Number.isNaN(h)) porHora.set(h, (porHora.get(h) ?? 0) + 1);
  }

  const tramos: TramoPuntuacion[] = [];
  const tope = Math.max(70, Math.floor(puntos[puntos.length - 1] / 10) * 10);
  for (let desde = 0; desde <= tope; desde += 10) {
    const ultimo = desde === tope;
    const n = puntuaciones.filter((p) =>
      ultimo ? p.puntos >= desde : p.puntos >= desde && p.puntos < desde + 10,
    ).length;
    // Los tramos vacíos de los extremos sobran; los de en medio se conservan
    // para no romper la escala del gráfico.
    if (n === 0 && (tramos.length === 0 || desde === tope)) continue;
    tramos.push({ desde, etiqueta: ultimo ? `${desde}+` : `${desde}-${desde + 9}`, partidas: n });
  }
  while (tramos.length > 0 && tramos[tramos.length - 1].partidas === 0) tramos.pop();

  return {
    partidas: puntuaciones.length,
    jugadores: tabla.length,
    media: Math.round((puntuaciones.length / tabla.length) * 10) / 10,
    unaVez: tabla.filter((r) => r.intentos === 1).length,
    repiten: tabla.filter((r) => r.intentos > 1).length,
    maxIntentos: Math.max(...tabla.map((r) => r.intentos)),
    conApellidos: tabla.filter((r) => r.apellidos.trim() !== '').length,
    puntosMax: puntos[puntos.length - 1],
    puntosMin: puntos[0],
    puntosMedia: Math.round((puntos.reduce((a, b) => a + b, 0) / puntos.length) * 10) / 10,
    puntosMediana: puntos[Math.floor(puntos.length / 2)],
    horas: [...porHora.entries()].sort((a, b) => a[0] - b[0]).map(([hora, partidas]) => ({ hora, partidas })),
    tramos,
    inicio: hhmm(ordenadas[0].createdAt),
    fin: hhmm(ordenadas[ordenadas.length - 1].createdAt),
  };
}
