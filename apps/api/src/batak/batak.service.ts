import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  norm,
  puestoDe,
  type BatakEstado,
  type BatakEvento,
  type BatakPuntuacion,
  type PuntuacionCreada,
} from '@batak/shared';
import { throwFromPostgrest } from '../common/supabase-error';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateBatakEventoDto } from './dto/create-evento.dto';
import { CreateBatakPuntuacionDto } from './dto/create-puntuacion.dto';

interface EventoRow {
  id: string;
  nombre: string;
  fecha: string;
  activo: boolean;
  created_at: string;
}

interface PuntuacionRow {
  id: string;
  evento_id: string;
  nombre: string;
  apellidos: string | null;
  puntos: number;
  created_at: string;
  batak_eventos?: { nombre: string; fecha: string } | null;
}

const toEvento = (row: EventoRow, partidas?: number): BatakEvento => ({
  id: row.id,
  nombre: row.nombre,
  fecha: row.fecha,
  activo: row.activo,
  createdAt: row.created_at,
  ...(partidas === undefined ? {} : { partidas }),
});

const toPuntuacion = (row: PuntuacionRow): BatakPuntuacion => ({
  id: row.id,
  eventoId: row.evento_id,
  nombre: row.nombre,
  // Las partidas anteriores a la migración 0003 no tienen apellidos.
  apellidos: row.apellidos ?? '',
  puntos: row.puntos,
  createdAt: row.created_at,
  ...(row.batak_eventos
    ? { eventoNombre: row.batak_eventos.nombre, eventoFecha: row.batak_eventos.fecha }
    : {}),
});

@Injectable()
export class BatakService {
  constructor(private readonly supabase: SupabaseService) {}

  // ---------- eventos ----------

  async listarEventos(): Promise<BatakEvento[]> {
    const { data, error } = await this.supabase
      .admin()
      .from('batak_eventos')
      .select('*, batak_puntuaciones(count)')
      .order('created_at', { ascending: false });

    if (error) throwFromPostgrest(error, 'listarEventos');

    // PostgREST devuelve el agregado como [{ count: n }], y como [] si no hay ninguna.
    return (data ?? []).map((row) => {
      const { batak_puntuaciones, ...evento } = row as EventoRow & {
        batak_puntuaciones?: { count: number }[];
      };
      return toEvento(evento as EventoRow, batak_puntuaciones?.[0]?.count ?? 0);
    });
  }

  /** Crea el evento y lo deja como activo. Atómico: lo resuelve una función de Postgres. */
  async crearEvento(dto: CreateBatakEventoDto): Promise<BatakEvento> {
    const { data, error } = await this.supabase
      .admin()
      .rpc('batak_crear_evento', {
        p_nombre: norm(dto.nombre),
        p_fecha: dto.fecha.slice(0, 10),
      })
      .single<EventoRow>();

    if (error) throwFromPostgrest(error, 'crearEvento');
    return toEvento(data);
  }

  async activarEvento(id: string): Promise<BatakEvento> {
    const { data, error } = await this.supabase
      .admin()
      .rpc('batak_activar_evento', { p_id: id })
      .single<EventoRow>();

    if (error) throwFromPostgrest(error, 'activarEvento');
    if (!data) throw new NotFoundException('Evento no encontrado');
    return toEvento(data);
  }

  /**
   * Borra un evento. Con `force`, se lleva también sus partidas.
   *
   * La FK es ON DELETE CASCADE, así que sin la comprobación previa un borrado
   * accidental se llevaría el histórico de toda una feria sin avisar. Por eso
   * el caso destructivo hay que pedirlo a propósito: el que no lo pide, cobra
   * un 409 que dice exactamente cuántas partidas hay en medio.
   */
  async borrarEvento(id: string, force = false): Promise<{ ok: true; partidasBorradas: number }> {
    const { count, error: countError } = await this.supabase
      .admin()
      .from('batak_puntuaciones')
      .select('id', { count: 'exact', head: true })
      .eq('evento_id', id);

    if (countError) throwFromPostgrest(countError, 'borrarEvento/contar');
    const partidas = count ?? 0;

    if (partidas > 0 && !force) {
      throw new ConflictException(
        `El evento tiene ${partidas} ${partidas === 1 ? 'partida' : 'partidas'}; ` +
          'bórralas o confirma el borrado completo.',
      );
    }

    const { data, error } = await this.supabase
      .admin()
      .from('batak_eventos')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throwFromPostgrest(error, 'borrarEvento');
    if (!data?.length) throw new NotFoundException('Evento no encontrado');
    return { ok: true, partidasBorradas: partidas };
  }

  // ---------- estado del evento activo (lo que consultan la TV y el iPad) ----------

  async estadoActivo(): Promise<BatakEstado> {
    const evento = await this.eventoActivo();
    if (!evento) return { evento: null, puntuaciones: [] };

    const { data, error } = await this.supabase
      .admin()
      .from('batak_puntuaciones')
      .select('*')
      .eq('evento_id', evento.id)
      .order('created_at', { ascending: false });

    if (error) throwFromPostgrest(error, 'estadoActivo');

    return {
      evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha, activo: true },
      puntuaciones: (data ?? []).map((row) => toPuntuacion(row as PuntuacionRow)),
    };
  }

  // ---------- puntuaciones ----------

  async listarTodas(): Promise<BatakPuntuacion[]> {
    const { data, error } = await this.supabase
      .admin()
      .from('batak_puntuaciones')
      .select('*, batak_eventos(nombre, fecha)')
      .order('created_at', { ascending: true });

    if (error) throwFromPostgrest(error, 'listarTodas');
    return (data ?? []).map((row) => toPuntuacion(row as PuntuacionRow));
  }

  /** Guarda una partida en el evento activo y devuelve el puesto que ocupa (0 si no mejora su récord). */
  async crearPuntuacion(dto: CreateBatakPuntuacionDto): Promise<PuntuacionCreada> {
    const evento = await this.eventoActivo();
    if (!evento) throw new ConflictException('No hay ningún evento activo');

    const { data, error } = await this.supabase
      .admin()
      .from('batak_puntuaciones')
      .insert({
        evento_id: evento.id,
        nombre: norm(dto.nombre),
        apellidos: norm(dto.apellidos),
        puntos: dto.puntos,
      })
      .select('*')
      .single<PuntuacionRow>();

    if (error) throwFromPostgrest(error, 'crearPuntuacion');
    const puntuacion = toPuntuacion(data);

    const { data: todas, error: listError } = await this.supabase
      .admin()
      .from('batak_puntuaciones')
      .select('*')
      .eq('evento_id', evento.id);

    // La partida ya está guardada: si falla leer el ranking no tiene sentido
    // devolver un error, solo nos quedamos sin saber el puesto.
    if (listError) return { puntuacion, puesto: 0 };

    const puesto = puestoDe(
      puntuacion.id,
      (todas ?? []).map((row) => toPuntuacion(row as PuntuacionRow)),
    );
    return { puntuacion, puesto };
  }

  async borrarPuntuacion(id: string): Promise<{ ok: true }> {
    const { data, error } = await this.supabase
      .admin()
      .from('batak_puntuaciones')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throwFromPostgrest(error, 'borrarPuntuacion');
    if (!data?.length) throw new NotFoundException('Puntuación no encontrada');
    return { ok: true };
  }

  // ---------- interno ----------

  private async eventoActivo(): Promise<EventoRow | null> {
    const { data, error } = await this.supabase
      .admin()
      .from('batak_eventos')
      .select('*')
      .eq('activo', true)
      .maybeSingle<EventoRow>();

    if (error) throwFromPostgrest(error, 'eventoActivo');
    return data ?? null;
  }
}
