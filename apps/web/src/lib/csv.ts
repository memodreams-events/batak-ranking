import type { BatakPuntuacion } from '@batak/shared';

/** Entrecomilla solo si hace falta, duplicando las comillas internas. */
function cell(value: unknown): string {
  const text = String(value ?? '');
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * CSV de todas las partidas para abrirlo en Excel.
 *
 * Separador `;` y BOM al principio: es lo que espera el Excel español, y sin el
 * BOM los acentos salen rotos.
 */
export function puntuacionesToCsv(puntuaciones: BatakPuntuacion[]): string {
  const rows: unknown[][] = [
    ['Evento', 'Fecha evento', 'Nombre', 'Apellidos', 'Puntuación', 'Fecha y hora'],
  ];
  for (const p of puntuaciones) {
    rows.push([
      p.eventoNombre ?? '',
      p.eventoFecha ?? '',
      p.nombre,
      p.apellidos ?? '',
      p.puntos,
      p.createdAt.replace('T', ' ').slice(0, 16),
    ]);
  }
  return '﻿' + rows.map((row) => row.map(cell).join(';')).join('\r\n');
}

export function downloadText(filename: string, text: string, type: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 1000);
}
