/** '14 jun 2026'. Acepta tanto 'YYYY-MM-DD' como un ISO completo. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  // Las fechas de evento son solo día: al mediodía para que ningún huso las
  // desplace al día anterior.
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** '18:42'. Devuelve '' si la fecha no es válida. */
export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/** Separador de millares español: 12.480. */
export function num(value: number): string {
  return Number(value).toLocaleString('es-ES');
}
