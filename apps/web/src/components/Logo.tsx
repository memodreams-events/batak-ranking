interface LogoProps {
  /** Alto del logo en clases de Tailwind. El ancho va siempre proporcional. */
  className?: string;
}

/**
 * Logo de Memodreams Events.
 *
 * Se sirve desde `public/` en vez de importarlo: es un SVG de 7 KB que no gana
 * nada por entrar en el bundle, y así se cambia por otra variante de la marca
 * sustituyendo el fichero, sin tocar código ni recompilar.
 *
 * La versión en blanco es la correcta sobre el fondo oscuro de la app; si
 * algún día el fondo se aclara, hay que cambiar a `memodreams-principal-negro`.
 */
export function Logo({ className = 'h-7' }: LogoProps) {
  return (
    <img
      src="/memodreams.svg"
      alt="Memodreams Events"
      className={`w-auto shrink-0 ${className}`}
      // El alto lo fija la clase; estos dos evitan el salto de maquetación
      // mientras el SVG carga.
      width={1293}
      height={352}
    />
  );
}
