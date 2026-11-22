import { leaderboard, nombreCompleto, norm, puestoDe, valoresConocidos } from '@batak/shared';
import type { BatakPuntuacion } from '@batak/shared';

const p = (
  id: string,
  nombre: string,
  apellidos: string,
  puntos: number,
  createdAt: string,
): BatakPuntuacion => ({ id, eventoId: 'e1', nombre, apellidos, puntos, createdAt });

describe('norm', () => {
  it('colapsa espacios y recorta', () => {
    expect(norm('  Ana   Gómez ')).toBe('Ana Gómez');
  });
});

describe('nombreCompleto', () => {
  it('une nombre y apellidos', () => {
    expect(nombreCompleto({ nombre: 'Pepe', apellidos: 'García' })).toBe('Pepe García');
  });

  it('sin apellidos devuelve solo el nombre, sin espacio sobrante', () => {
    expect(nombreCompleto({ nombre: 'Pepe', apellidos: '' })).toBe('Pepe');
    expect(nombreCompleto({ nombre: 'Pepe' })).toBe('Pepe');
  });
});

describe('leaderboard', () => {
  it('NO fusiona a dos personas con el mismo nombre y distintos apellidos', () => {
    const rows = leaderboard([
      p('1', 'Pepe', 'García', 9000, '2026-05-01T10:00:00Z'),
      p('2', 'Pepe', 'Ramírez', 12000, '2026-05-01T10:01:00Z'),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.map(nombreCompleto)).toEqual(['Pepe Ramírez', 'Pepe García']);
    expect(rows.every((r) => r.intentos === 1)).toBe(true);
  });

  it('sí agrupa a la misma persona aunque cambien mayúsculas y espacios', () => {
    const rows = leaderboard([
      p('1', 'pepe', 'garcía', 9000, '2026-05-01T10:00:00Z'),
      p('2', 'Pepe', ' García ', 12000, '2026-05-01T10:01:00Z'),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].intentos).toBe(2);
    expect(rows[0].puntos).toBe(12000);
  });

  it('distingue a quien tiene apellidos de quien no los tiene', () => {
    const rows = leaderboard([
      p('1', 'Pepe', '', 9000, '2026-05-01T10:00:00Z'),
      p('2', 'Pepe', 'García', 12000, '2026-05-01T10:01:00Z'),
    ]);

    expect(rows).toHaveLength(2);
  });

  it('ordena de mayor a menor y cuenta los intentos', () => {
    const rows = leaderboard([
      p('1', 'Ana', 'Gil', 100, '2026-05-01T10:00:00Z'),
      p('2', 'Bea', 'Soto', 300, '2026-05-01T10:01:00Z'),
      p('3', 'Ana', 'Gil', 200, '2026-05-01T10:02:00Z'),
    ]);

    expect(rows.map((r) => [nombreCompleto(r), r.puntos, r.intentos])).toEqual([
      ['Bea Soto', 300, 1],
      ['Ana Gil', 200, 2],
    ]);
  });

  it('se queda con el récord de cada jugador, no con el último', () => {
    const rows = leaderboard([
      p('1', 'Ana', 'Gil', 500, '2026-05-01T10:00:00Z'),
      p('2', 'Ana', 'Gil', 100, '2026-05-01T10:05:00Z'),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].puntos).toBe(500);
    expect(rows[0].puntuacionId).toBe('1');
  });

  it('en caso de empate gana quien lo consiguió antes', () => {
    const rows = leaderboard([
      p('1', 'Tarde', 'Uno', 200, '2026-05-01T12:00:00Z'),
      p('2', 'Pronto', 'Dos', 200, '2026-05-01T09:00:00Z'),
    ]);

    expect(rows.map((r) => r.nombre)).toEqual(['Pronto', 'Tarde']);
  });

  it('con un empate consigo mismo conserva la partida más antigua', () => {
    const rows = leaderboard([
      p('1', 'Ana', 'Gil', 200, '2026-05-01T12:00:00Z'),
      p('2', 'Ana', 'Gil', 200, '2026-05-01T09:00:00Z'),
    ]);

    expect(rows[0].puntuacionId).toBe('2');
  });

  it('sin partidas devuelve una tabla vacía', () => {
    expect(leaderboard([])).toEqual([]);
  });
});

describe('puestoDe', () => {
  const partidas = [
    p('1', 'Ana', 'Gil', 100, '2026-05-01T10:00:00Z'),
    p('2', 'Bea', 'Soto', 300, '2026-05-01T10:01:00Z'),
    p('3', 'Ana', 'Gil', 200, '2026-05-01T10:02:00Z'),
  ];

  it('devuelve el puesto de la partida que es récord de su jugador', () => {
    expect(puestoDe('2', partidas)).toBe(1);
    expect(puestoDe('3', partidas)).toBe(2);
  });

  it('devuelve 0 si la partida no mejora el récord del jugador', () => {
    expect(puestoDe('1', partidas)).toBe(0);
  });
});

describe('valoresConocidos', () => {
  const partidas = [
    p('1', 'Zoe', 'Vidal', 10, '2026-05-01T10:00:00Z'),
    p('2', 'ana', 'Gil', 10, '2026-05-01T10:00:00Z'),
    p('3', 'Ana', 'Gil', 10, '2026-05-01T10:00:00Z'),
  ];

  it('no repite y ordena en español', () => {
    expect(valoresConocidos('nombre', partidas)).toEqual(['ana', 'Zoe']);
    expect(valoresConocidos('apellidos', partidas)).toEqual(['Gil', 'Vidal']);
  });

  it('ignora los apellidos vacíos de las partidas antiguas', () => {
    expect(valoresConocidos('apellidos', [p('4', 'Solo', '', 10, '2026-05-01T10:00:00Z')])).toEqual(
      [],
    );
  });
});
