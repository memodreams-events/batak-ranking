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
import { ImportarDto } from './dto/importar.dto';

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

  // ---------- ficha de evento ----------

  /** Evento con todas sus partidas y el número de aperturas del QR. */
  async detalleEvento(id: string): Promise<{
    evento: BatakEvento;
    puntuaciones: BatakPuntuacion[];
    visitas: number;
  }> {
    const admin = this.supabase.admin();

    const { data: evento, error } = await admin
      .from('batak_eventos')
      .select('*')
      .eq('id', id)
      .maybeSingle<EventoRow>();
    if (error) throwFromPostgrest(error, 'detalleEvento');
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const [partidas, visitas] = await Promise.all([
      admin
        .from('batak_puntuaciones')
        .select('*')
        .eq('evento_id', id)
        .order('created_at', { ascending: true }),
      admin.from('batak_visitas').select('id', { count: 'exact', head: true }).eq('evento_id', id),
    ]);

    if (partidas.error) throwFromPostgrest(partidas.error, 'detalleEvento/puntuaciones');
    // Si falla solo el contador, la ficha sigue valiendo: mejor enseñarla sin
    // ese dato que caerse entera por una cifra accesoria.
    const visitasCount = visitas.error ? 0 : (visitas.count ?? 0);

    return {
      evento: toEvento(evento, partidas.data?.length ?? 0),
      puntuaciones: (partidas.data ?? []).map((row) => toPuntuacion(row as PuntuacionRow)),
      visitas: visitasCount,
    };
  }

  /**
   * Registra una apertura de la pantalla del QR en el evento activo.
   *
   * Silencioso a propósito: es telemetría accesoria y el visitante no debe ver
   * un error si falla. Sin evento activo simplemente no se cuenta nada.
   */
  async registrarVisita(): Promise<{ ok: true }> {
    const evento = await this.eventoActivo();
    if (!evento) return { ok: true };
    await this.supabase.admin().from('batak_visitas').insert({ evento_id: evento.id });
    return { ok: true };
  }

  // ---------- importación ----------

  /**
   * Carga un histórico de golpe.
   *
   * Las filas que traen nombre de evento se agrupan por evento y fecha; las que
   * no lo traen van al evento activo. Los eventos que no existan se crean
   * **desactivados**: importar un histórico de ferias pasadas no debe cambiar
   * cuál es el evento en curso, que es lo que está mirando la TV del stand.
   *
   * No hay deduplicación: importar dos veces el mismo fichero mete las partidas
   * dos veces. Avisar de eso es cosa de la pantalla, que enseña un resumen
   * antes de confirmar.
   */
  async importar(
    dto: ImportarDto,
  ): Promise<{ eventosCreados: number; partidasImportadas: number }> {
    const admin = this.supabase.admin();

    const { data: existentes, error: errorEventos } = await admin
      .from('batak_eventos')
      .select('id, nombre, fecha');
    if (errorEventos) throwFromPostgrest(errorEventos, 'importar/eventos');

    // Clave por nombre normalizado y fecha: así un "Feria Madrid" repetido en
    // el CSV reutiliza el evento en vez de crear uno por fila.
    const clave = (nombre: string, fecha: string) => `${norm(nombre).toLowerCase()}|${fecha}`;
    const porClave = new Map<string, string>();
    for (const e of (existentes ?? []) as { id: string; nombre: string; fecha: string }[]) {
      porClave.set(clave(e.nombre, e.fecha), e.id);
    }

    const activo = await this.eventoActivo();
    const hoy = new Date().toISOString().slice(0, 10);

    const nuevos: { nombre: string; fecha: string; activo: boolean }[] = [];
    const clavesNuevas: string[] = [];

    for (const fila of dto.filas) {
      if (!fila.evento) continue;
      const fecha = (fila.fechaEvento ?? hoy).slice(0, 10);
      const k = clave(fila.evento, fecha);
      if (porClave.has(k) || clavesNuevas.includes(k)) continue;
      clavesNuevas.push(k);
      nuevos.push({ nombre: norm(fila.evento), fecha, activo: false });
    }

    if (nuevos.length > 0) {
      const { data: creados, error } = await admin
        .from('batak_eventos')
        .insert(nuevos)
        .select('id, nombre, fecha');
      if (error) throwFromPostgrest(error, 'importar/crearEventos');
      for (const e of (creados ?? []) as { id: string; nombre: string; fecha: string }[]) {
        porClave.set(clave(e.nombre, e.fecha), e.id);
      }
    }

    const puntuaciones = dto.filas.map((fila) => {
      const eventoId = fila.evento
        ? porClave.get(clave(fila.evento, (fila.fechaEvento ?? hoy).slice(0, 10)))
        : activo?.id;
      if (!eventoId) {
        throw new ConflictException(
          'Hay filas sin evento y no hay ningún evento activo donde ponerlas.',
        );
      }
      return {
        evento_id: eventoId,
        nombre: norm(fila.nombre),
        apellidos: norm(fila.apellidos ?? ''),
        puntos: fila.puntos,
        ...(fila.createdAt ? { created_at: fila.createdAt } : {}),
      };
    });

    const { error: errorInsert } = await admin.from('batak_puntuaciones').insert(puntuaciones);
    if (errorInsert) throwFromPostgrest(errorInsert, 'importar/puntuaciones');

    return { eventosCreados: nuevos.length, partidasImportadas: puntuaciones.length };
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
