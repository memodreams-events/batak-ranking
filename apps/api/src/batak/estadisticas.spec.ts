import { estadisticasDeEvento } from '@batak/shared';
import type { BatakPuntuacion } from '@batak/shared';

/** createdAt en hora local, que es como las lee el navegador del stand. */
const p = (
  id: string,
  nombre: string,
  apellidos: string,
  puntos: number,
  hora: number,
  minuto = 0,
): BatakPuntuacion => {
  const d = new Date(2026, 10, 22, hora, minuto, 0);
  return { id, eventoId: 'e1', nombre, apellidos, puntos, createdAt: d.toISOString() };
};

describe('estadisticasDeEvento', () => {
  it('sin partidas devuelve todo a cero sin romperse', () => {
    const s = estadisticasDeEvento([]);
    expect(s.partidas).toBe(0);
    expect(s.jugadores).toBe(0);
    expect(s.horas).toEqual([]);
    expect(s.tramos).toEqual([]);
  });

  it('cuenta partidas y jugadores distintos', () => {
    const s = estadisticasDeEvento([
      p('1', 'Ana', 'Gil', 30, 10),
      p('2', 'Ana', 'Gil', 40, 11),
      p('3', 'Bea', 'Soto', 20, 11),
    ]);
    expect(s.partidas).toBe(3);
    expect(s.jugadores).toBe(2);
    expect(s.media).toBe(1.5);
    expect(s.unaVez).toBe(1);
    expect(s.repiten).toBe(1);
    expect(s.maxIntentos).toBe(2);
  });

  it('agrupa por hora local, no por la hora UTC del ISO', () => {
    // Es el fallo que tuvo el primer informe: en invierno España va una hora
    // por delante de UTC y el pico de afluencia salía desplazado.
    const s = estadisticasDeEvento([p('1', 'Ana', 'Gil', 30, 9), p('2', 'Bea', 'Soto', 30, 9)]);
    expect(s.horas).toEqual([{ hora: 9, partidas: 2 }]);
  });

  it('calcula máximo, mínimo, media y mediana', () => {
    const s = estadisticasDeEvento([
      p('1', 'A', 'A', 10, 10),
      p('2', 'B', 'B', 20, 10),
      p('3', 'C', 'C', 60, 10),
    ]);
    expect(s.puntosMax).toBe(60);
    expect(s.puntosMin).toBe(10);
    expect(s.puntosMedia).toBe(30);
    expect(s.puntosMediana).toBe(20);
  });

  it('agrupa en tramos de diez y no deja tramos vacíos en los extremos', () => {
    const s = estadisticasDeEvento([
      p('1', 'A', 'A', 25, 10),
      p('2', 'B', 'B', 34, 10),
      p('3', 'C', 'C', 38, 10),
    ]);
    expect(s.tramos.map((t) => [t.etiqueta, t.partidas])).toEqual([
      ['20-29', 1],
      ['30-39', 2],
    ]);
  });

  it('conserva los tramos vacíos intermedios para no falsear la escala', () => {
    const s = estadisticasDeEvento([p('1', 'A', 'A', 15, 10), p('2', 'B', 'B', 45, 10)]);
    expect(s.tramos.map((t) => t.etiqueta)).toEqual(['10-19', '20-29', '30-39', '40-49']);
    expect(s.tramos.map((t) => t.partidas)).toEqual([1, 0, 0, 1]);
  });

  it('cuenta cuántos jugadores tienen apellidos', () => {
    const s = estadisticasDeEvento([p('1', 'Ana', 'Gil', 30, 10), p('2', 'Mohamed', '', 30, 10)]);
    expect(s.conApellidos).toBe(1);
    expect(s.jugadores).toBe(2);
  });

  it('da la primera y la última hora del evento', () => {
    const s = estadisticasDeEvento([p('2', 'B', 'B', 30, 16, 45), p('1', 'A', 'A', 30, 9, 32)]);
    expect(s.inicio).toBe('09:32');
    expect(s.fin).toBe('16:45');
  });
});
