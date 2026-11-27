/**
 * Panel con el QR que la gente escanea desde el stand para seguir el ranking
 * en su móvil. Solo aparece en el modo TV, dentro de la columna lateral.
 *
 * Antes iba en posición fija sobre el contenido y tapaba la puntuación de las
 * últimas filas. Ahora ocupa su propio espacio en la rejilla: no puede solapar
 * nada por larga que sea la clasificación.
 *
 * El SVG es un fichero estático en `public/` y no se genera en caliente: así
 * no entra una librería de QR en el bundle por un recuadro que no cambia
 * nunca. Codifica la URL pública de producción a propósito, porque es la que
 * debe llevarse la gente aunque la TV esté abierta en una preview.
 *
 * Si algún día el web cambia de dominio, hay que regenerarlo:
 *   npx qrcode -t svg -o apps/web/public/qr-ranking.svg -e H -w 600 "<nueva-url>/r"
 */
export function QrPanel() {
  return (
    <aside className="w-full rounded-2xl border border-line bg-panel p-[max(0.75rem,1.4vh)] text-center">
      {/* El QR necesita fondo claro para que las cámaras lo lean con fiabilidad. */}
      <img
        src="/qr-ranking.svg"
        alt="Código QR para ver el ranking en el móvil"
        className="mx-auto block aspect-square w-full rounded-lg bg-white p-[max(0.5rem,0.9vh)]"
      />
      <p className="mt-[max(0.5rem,1vh)] font-display text-[max(1.1rem,2.1vh)] font-bold uppercase leading-tight tracking-wide text-amber">
        Escanea y sigue el ranking
      </p>
      <p className="mt-1 text-[max(0.7rem,1.1vh)] leading-snug text-fg2">
        Míralo en tu móvil en directo
      </p>
    </aside>
  );
}
