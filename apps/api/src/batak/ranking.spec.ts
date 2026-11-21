import { leaderboard, nombresConocidos, norm, puestoDe } from '@batak/shared';
import type { BatakPuntuacion } from '@batak/shared';

const p = (id: string, nombre: string, puntos: number, createdAt: string): BatakPuntuacion => ({
  id,
  eventoId: 'e1',
  nombre,
  puntos,
  createdAt,
});

describe('norm', () => {
  it('colapsa espacios y recorta', () => {
    expect(norm('  Ana   Gómez ')).toBe('Ana Gómez');
  });
});

describe('leaderboard', () => {
  it('ordena de mayor a menor y cuenta los intentos', () => {
    const rows = leaderboard([
      p('1', 'Ana', 100, '2026-05-01T10:00:00Z'),
      p('2', 'Bea', 300, '2026-05-01T10:01:00Z'),
      p('3', 'Ana', 200, '2026-05-01T10:02:00Z'),
    ]);

    expect(rows.map((r) => [r.nombre, r.puntos, r.intentos])).toEqual([
      ['Bea', 300, 1],
      ['Ana', 200, 2],
    ]);
  });

  it('se queda con el récord de cada jugador, no con el último', () => {
    const rows = leaderboard([
      p('1', 'Ana', 500, '2026-05-01T10:00:00Z'),
      p('2', 'Ana', 100, '2026-05-01T10:05:00Z'),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].puntos).toBe(500);
    expect(rows[0].puntuacionId).toBe('1');
  });

  it('agrupa el mismo jugador aunque cambien mayúsculas y espacios', () => {
    const rows = leaderboard([
      p('1', 'ana gómez', 100, '2026-05-01T10:00:00Z'),
      p('2', 'Ana  Gómez', 200, '2026-05-01T10:01:00Z'),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].intentos).toBe(2);
  });

  it('en caso de empate gana quien lo consiguió antes', () => {
    const rows = leaderboard([
      p('1', 'Tarde', 200, '2026-05-01T12:00:00Z'),
      p('2', 'Pronto', 200, '2026-05-01T09:00:00Z'),
    ]);

    expect(rows.map((r) => r.nombre)).toEqual(['Pronto', 'Tarde']);
  });

  it('con un empate consigo mismo conserva la partida más antigua', () => {
    const rows = leaderboard([
      p('1', 'Ana', 200, '2026-05-01T12:00:00Z'),
      p('2', 'Ana', 200, '2026-05-01T09:00:00Z'),
    ]);

    expect(rows[0].puntuacionId).toBe('2');
  });

  it('sin partidas devuelve una tabla vacía', () => {
    expect(leaderboard([])).toEqual([]);
  });
});

describe('puestoDe', () => {
  const partidas = [
    p('1', 'Ana', 100, '2026-05-01T10:00:00Z'),
    p('2', 'Bea', 300, '2026-05-01T10:01:00Z'),
    p('3', 'Ana', 200, '2026-05-01T10:02:00Z'),
  ];

  it('devuelve el puesto de la partida que es récord de su jugador', () => {
    expect(puestoDe('2', partidas)).toBe(1);
    expect(puestoDe('3', partidas)).toBe(2);
  });

  it('devuelve 0 si la partida no mejora el récord del jugador', () => {
    // '1' es de Ana, que tiene 200 en la partida '3': no sale en la tabla.
    expect(puestoDe('1', partidas)).toBe(0);
  });
});

describe('nombresConocidos', () => {
  it('no repite nombres y los ordena en español', () => {
    const nombres = nombresConocidos(
      [p('1', 'Zoe', 10, '2026-05-01T10:00:00Z'), p('2', 'ana', 10, '2026-05-01T10:00:00Z')],
      [p('3', 'Ana', 10, '2026-05-01T10:00:00Z'), p('4', 'Ünal', 10, '2026-05-01T10:00:00Z')],
    );

    expect(nombres).toEqual(['ana', 'Ünal', 'Zoe']);
  });
});
