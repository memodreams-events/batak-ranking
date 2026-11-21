/**
 * Panel con el QR que la gente escanea desde el stand para seguir el ranking
 * en su móvil. Solo aparece en el modo TV.
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
    <aside className="fixed bottom-6 right-6 flex items-center gap-4 rounded-2xl border border-line bg-panel/95 p-4 backdrop-blur">
      {/* El QR necesita fondo claro para que las cámaras lo lean con fiabilidad. */}
      <img
        src="/qr-ranking.svg"
        alt="Código QR para ver el ranking en el móvil"
        className="h-[max(7rem,14vh)] w-[max(7rem,14vh)] rounded-lg bg-white p-2"
      />
      <div className="max-w-[16ch]">
        <p className="font-display text-[max(1.5rem,2.6vh)] font-bold uppercase leading-tight tracking-wide text-amber">
          Escanea y sigue el ranking
        </p>
        <p className="mt-1 text-[max(0.8rem,1.3vh)] leading-snug text-fg2">
          Míralo en tu móvil en directo
        </p>
      </div>
    </aside>
  );
}
