export interface FilaImportada {
  nombre: string;
  apellidos?: string;
  puntos: number;
  evento?: string;
  fechaEvento?: string;
  createdAt?: string;
}

export interface ResultadoParseo {
  filas: FilaImportada[];
  /** Problemas por fila, con su número de línea, para enseñarlos antes de importar. */
  errores: string[];
  /** Nombres de evento distintos encontrados. */
  eventos: string[];
}

/** Quita acentos y mayúsculas para comparar cabeceras escritas de cualquier manera. */
function clave(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

/** Nombres aceptados para cada columna. El primero es el de nuestra exportación. */
const COLUMNAS: Record<keyof FilaImportada, string[]> = {
  nombre: ['nombre'],
  apellidos: ['apellidos', 'apellido'],
  puntos: ['puntuacion', 'puntos', 'score'],
  evento: ['evento', 'feria'],
  fechaEvento: ['fecha evento', 'fecha del evento', 'fecha'],
  createdAt: ['fecha y hora', 'fecha hora', 'timestamp'],
};

/** Columnas sueltas de fecha y hora de la partida, que algunas exportaciones separan. */
const COL_FECHA_PARTIDA = ['fecha'];
const COL_HORA_PARTIDA = ['hora'];

/** Parte una línea de CSV respetando las comillas dobles. */
function partirLinea(linea: string, sep: string): string[] {
  const out: string[] = [];
  let actual = '';
  let enComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (enComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        enComillas = !enComillas;
      }
    } else if (c === sep && !enComillas) {
      out.push(actual);
      actual = '';
    } else {
      actual += c;
    }
  }
  out.push(actual);
  return out.map((v) => v.trim());
}

/** El separador es el que más aparece en la cabecera: Excel español usa ';', el resto del mundo ','. */
function detectarSeparador(cabecera: string): string {
  const puntoYComa = (cabecera.match(/;/g) ?? []).length;
  const coma = (cabecera.match(/,/g) ?? []).length;
  if (puntoYComa === 0 && coma === 0) return '\t';
  return puntoYComa >= coma ? ';' : ',';
}

/** '1.234', '1234', '1 234' -> 1234. Devuelve null si no hay un número dentro. */
function aNumero(texto: string): number | null {
  const limpio = texto.replace(/[^\d-]/g, '');
  if (!limpio) return null;
  const n = Number.parseInt(limpio, 10);
  return Number.isFinite(n) ? n : null;
}

/** 'YYYY-MM-DD' a partir de ese formato o de 'DD/MM/YYYY'. '' si no se reconoce. */
function aFecha(texto: string): string {
  const t = texto.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}

/**
 * Lee un CSV exportado por esta misma app o escrito a mano.
 *
 * Es deliberadamente tolerante: acepta `;`, `,` o tabulador, cabeceras con o
 * sin acentos y en cualquier orden, y miles con punto. Lo único que exige es
 * una columna de nombre y otra de puntuación, porque sin eso no hay partida.
 */
export function parsearCsv(texto: string): ResultadoParseo {
  // El BOM que mete Excel se cuela en el nombre de la primera columna.
  const limpio = texto.replace(/^\uFEFF/, '');
  const lineas = limpio.split(/\r?\n/).filter((l) => l.trim() !== '');

  if (lineas.length < 2) {
    return {
      filas: [],
      errores: ['El fichero no tiene datos (solo cabecera o está vacío).'],
      eventos: [],
    };
  }

  const sep = detectarSeparador(lineas[0]);
  const cabecera = partirLinea(lineas[0], sep).map(clave);

  const indice = (campo: keyof FilaImportada): number => {
    for (const alias of COLUMNAS[campo]) {
      const i = cabecera.indexOf(clave(alias));
      if (i !== -1) return i;
    }
    return -1;
  };

  const iNombre = indice('nombre');
  const iPuntos = indice('puntos');
  if (iNombre === -1 || iPuntos === -1) {
    return {
      filas: [],
      errores: [
        `No encuentro las columnas obligatorias. Hacen falta "Nombre" y "Puntuación". Cabecera leída: ${cabecera.join(' | ')}`,
      ],
      eventos: [],
    };
  }

  const iApellidos = indice('apellidos');
  const iEvento = indice('evento');
  const iFecha = indice('fechaEvento');
  const iCreated = indice('createdAt');
  // 'Fecha evento' y 'Fecha' son columnas distintas: la primera data el evento
  // y la segunda la partida. Como las claves no coinciden exactamente, cada
  // una cae en su índice sin pisarse.
  const iFechaPartida =
    COL_FECHA_PARTIDA.map((c) => cabecera.indexOf(clave(c))).find((i) => i !== -1) ?? -1;
  const iHoraPartida =
    COL_HORA_PARTIDA.map((c) => cabecera.indexOf(clave(c))).find((i) => i !== -1) ?? -1;

  const filas: FilaImportada[] = [];
  const errores: string[] = [];
  const eventos = new Set<string>();

  for (let n = 1; n < lineas.length; n++) {
    const celdas = partirLinea(lineas[n], sep);
    const nombre = (celdas[iNombre] ?? '').trim();
    const puntos = aNumero(celdas[iPuntos] ?? '');

    if (!nombre) {
      errores.push(`Línea ${n + 1}: sin nombre, la salto.`);
      continue;
    }
    if (puntos === null || puntos < 0) {
      errores.push(
        `Línea ${n + 1} (${nombre}): puntuación no válida "${celdas[iPuntos] ?? ''}", la salto.`,
      );
      continue;
    }

    const evento = iEvento === -1 ? '' : (celdas[iEvento] ?? '').trim();
    if (evento) eventos.add(evento);

    filas.push({
      nombre: nombre.slice(0, 60),
      apellidos: iApellidos === -1 ? '' : (celdas[iApellidos] ?? '').trim().slice(0, 80),
      puntos,
      ...(evento ? { evento: evento.slice(0, 80) } : {}),
      ...(iFecha !== -1 && aFecha(celdas[iFecha] ?? '')
        ? { fechaEvento: aFecha(celdas[iFecha] ?? '') }
        : {}),
      ...(() => {
        const created = momentoDeLaPartida(celdas, iCreated, iFechaPartida, iHoraPartida);
        return created ? { createdAt: created } : {};
      })(),
    });
  }

  return { filas, errores, eventos: [...eventos] };
}

/**
 * Momento en que se jugó la partida, venga en una columna o en dos.
 *
 * Conservarlo importa porque los empates se resuelven por quién lo consiguió
 * antes: si todas las filas importadas llegaran con la hora de la importación,
 * el desempate del histórico sería arbitrario.
 */
function momentoDeLaPartida(
  celdas: string[],
  iCreated: number,
  iFecha: number,
  iHora: number,
): string | null {
  if (iCreated !== -1 && (celdas[iCreated] ?? '').trim()) {
    return (celdas[iCreated] ?? '').trim().replace(' ', 'T');
  }
  const fecha = iFecha === -1 ? '' : aFecha(celdas[iFecha] ?? '');
  if (!fecha) return null;
  const hora = iHora === -1 ? '' : (celdas[iHora] ?? '').trim();
  return hora ? `${fecha}T${hora}` : `${fecha}T12:00:00`;
}
