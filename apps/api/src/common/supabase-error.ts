import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';

const logger = new Logger('Supabase');

/** Traduce un error de PostgREST a una excepción HTTP con un mensaje que el stand entienda. */
export function throwFromPostgrest(error: PostgrestError, context: string): never {
  logger.error(`${context}: [${error.code}] ${error.message}`);

  switch (error.code) {
    case 'PGRST116': // 0 filas con .single()
      throw new NotFoundException('No encontrado.');
    case '02000': // no_data_found, el que lanzan nuestras funciones plpgsql
      throw new NotFoundException('Evento no encontrado.');
    case '23505': // unique violation
      throw new ConflictException('Ya existe un registro con esos datos.');
    case '23503': // foreign key violation
      throw new BadRequestException('El evento indicado no existe.');
    case '23514': // check violation
      throw new BadRequestException('Algún campo no cumple las validaciones.');
    default:
      throw new InternalServerErrorException('Error al acceder a los datos.');
  }
}
