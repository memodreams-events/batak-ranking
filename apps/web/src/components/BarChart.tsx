interface Barra {
  etiqueta: string;
  valor: number;
}

interface BarChartProps {
  datos: Barra[];
  /** Describe qué mide el eje, para quien use lector de pantalla. */
  titulo: string;
  alto?: number;
}

/**
 * Columnas de una sola serie.
 *
 * Una serie, un color: el ámbar de la marca. Sin leyenda —el título ya dice
 * qué se mide— y con el valor escrito sobre cada barra, que en un gráfico de
 * pocas columnas se lee mejor que un eje vertical y ahorra la rejilla densa.
 *
 * Los extremos superiores van redondeados y la base queda anclada a la línea
 * cero, para que la altura siga siendo comparable de un vistazo.
 */
export function BarChart({ datos, titulo, alto = 180 }: BarChartProps) {
  if (datos.length === 0) return <p className="hint">Sin datos suficientes.</p>;

  const ancho = 640;
  const padSup = 26;
  const maximo = Math.max(...datos.map((d) => d.valor), 1);
  const hueco = 10;
  const bw = (ancho - hueco * (datos.length - 1)) / datos.length;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${ancho} ${alto + 24}`}
        width="100%"
        role="img"
        aria-label={titulo}
        className="overflow-visible"
      >
        {[0.25, 0.5, 0.75, 1].map((f) => {
          const y = padSup + (alto - padSup) * (1 - f);
          return <line key={f} x1="0" y1={y} x2={ancho} y2={y} stroke="#2a3450" strokeWidth="1" />;
        })}

        {datos.map((d, i) => {
          const bh = ((alto - padSup) * d.valor) / maximo;
          const x = i * (bw + hueco);
          const y = alto - bh;
          const r = Math.min(4, bh / 2);
          return (
            <g key={d.etiqueta}>
              <path
                d={`M${x},${alto} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + bw - r},${y} Q${x + bw},${y} ${x + bw},${y + r} L${x + bw},${alto} Z`}
                fill="#ffb627"
              />
              <text
                x={x + bw / 2}
                y={y - 7}
                textAnchor="middle"
                fontSize="13"
                fontWeight="600"
                fill="#eef1f8"
              >
                {d.valor}
              </text>
              <text x={x + bw / 2} y={alto + 17} textAnchor="middle" fontSize="12" fill="#9aa6c4">
                {d.etiqueta}
              </text>
            </g>
          );
        })}

        <line x1="0" y1={alto} x2={ancho} y2={alto} stroke="#9aa6c4" strokeWidth="1.5" />
      </svg>
    </figure>
  );
}
