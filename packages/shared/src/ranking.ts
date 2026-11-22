import type { BatakPuntuacion, RankRow } from './types';

/** Colapsa los espacios de un texto para que "Ana  Gómez" y "Ana Gómez" sean lo mismo. */
export function norm(texto: string): string {
  return String(texto ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/** 'Pepe García'. Si no hay apellidos, solo el nombre. */
export function nombreCompleto(persona: { nombre: string; apellidos?: string }): string {
  return norm(`${persona.nombre ?? ''} ${persona.apellidos ?? ''}`);
}

/**
 * Clave de agrupación: nombre y apellidos juntos, sin distinguir mayúsculas.
 *
 * Incluir los apellidos es lo que impide que dos personas llamadas igual
 * acaben compartiendo fila, que es justo lo que pasaba antes.
 */
export function playerKey(persona: { nombre: string; apellidos?: string }): string {
  return nombreCompleto(persona).toLowerCase();
}

/**
 * Texto preparado para buscar: sin tildes, sin mayúsculas y sin espacios de más.
 *
 * En una feria el azafato escribe "jose" y el jugador se apuntó como "José";
 * si la búsqueda distinguiera tildes no lo encontraría nunca.
 */
export function paraBusqueda(texto: string): string {
  return norm(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** true si el jugador encaja con lo escrito en el buscador. Una consulta vacía deja pasar a todos. */
export function coincideJugador(
  persona: { nombre: string; apellidos?: string },
  consulta: string,
): boolean {
  const q = paraBusqueda(consulta);
  if (!q) return true;
  // Por trozos: "gar jo" encuentra a "José García" aunque el orden no coincida.
  return q.split(' ').every((trozo) => paraBusqueda(nombreCompleto(persona)).includes(trozo));
}

/**
 * Clasificación a partir de las partidas: una fila por jugador con su mejor
 * puntuación, de mayor a menor.
 *
 * Vive aquí y no en cada lado porque el API la necesita para decirle al iPad
 * qué puesto ha alcanzado la partida recién apuntada, y la web para pintar la
 * tabla. Si las dos versiones se separan, el puesto del toast deja de coincidir
 * con el de la TV.
 *
 * Empates: gana quien lo consiguió antes.
 */
export function leaderboard(puntuaciones: BatakPuntuacion[]): RankRow[] {
  const mejor = new Map<string, RankRow>();

  for (const p of puntuaciones) {
    const key = playerKey(p);
    const actual = mejor.get(key);

    if (!actual) {
      mejor.set(key, {
        nombre: norm(p.nombre),
        apellidos: norm(p.apellidos ?? ''),
        puntos: p.puntos,
        intentos: 1,
        createdAt: p.createdAt,
        puntuacionId: p.id,
        eventoNombre: p.eventoNombre,
      });
      continue;
    }

    actual.intentos++;
    if (p.puntos > actual.puntos || (p.puntos === actual.puntos && p.createdAt < actual.createdAt)) {
      actual.puntos = p.puntos;
      actual.createdAt = p.createdAt;
      actual.puntuacionId = p.id;
      actual.eventoNombre = p.eventoNombre;
    }
  }

  return [...mejor.values()].sort(
    (a, b) =>
      b.puntos - a.puntos || (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0),
  );
}

/**
 * Puesto (1 = primero) que ocupa una partida en la clasificación, o 0 si no es
 * el récord de ese jugador y por tanto no aparece en la tabla.
 */
export function puestoDe(puntuacionId: string, puntuaciones: BatakPuntuacion[]): number {
  return leaderboard(puntuaciones).findIndex((row) => row.puntuacionId === puntuacionId) + 1;
}

/** Valores ya vistos de un campo, ordenados, para el autocompletado del iPad. */
export function valoresConocidos(
  campo: 'nombre' | 'apellidos',
  ...grupos: BatakPuntuacion[][]
): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const grupo of grupos) {
    for (const p of grupo) {
      const valor = norm(p[campo] ?? '');
      if (!valor) continue;
      const key = valor.toLowerCase();
      if (vistos.has(key)) continue;
      vistos.add(key);
      out.push(valor);
    }
  }
  return out.sort((a, b) => a.localeCompare(b, 'es'));
}
