export interface BatakEvento {
  id: string;
  nombre: string;
  /** YYYY-MM-DD */
  fecha: string;
  activo?: boolean;
  /** Número de partidas apuntadas en el evento. */
  partidas?: number;
  createdAt?: string;
}

export interface BatakPuntuacion {
  id: string;
  eventoId: string;
  nombre: string;
  puntos: number;
  createdAt: string;
  /** Solo en el histórico global, donde cada fila puede venir de un evento distinto. */
  eventoNombre?: string;
  eventoFecha?: string;
}

/** Lo que leen la TV del stand y el iPad: el evento activo y sus partidas. */
export interface BatakEstado {
  evento: BatakEvento | null;
  puntuaciones: BatakPuntuacion[];
}

/** Fila de clasificación: el mejor resultado de cada jugador. */
export interface RankRow {
  nombre: string;
  puntos: number;
  intentos: number;
  createdAt: string;
  puntuacionId: string;
  eventoNombre?: string;
}

/** Respuesta de POST /batak/puntuaciones. `puesto` es 0 si la partida no mejora el récord del jugador. */
export interface PuntuacionCreada {
  puntuacion: BatakPuntuacion;
  puesto: number;
}
