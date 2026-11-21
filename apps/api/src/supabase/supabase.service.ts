import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Dos clientes y una regla: leer va con la anon key, escribir con service_role.
 *
 * No hay usuarios ni JWT en esta app, así que RLS no puede distinguir a nadie:
 * las políticas solo permiten SELECT. Toda escritura necesita saltarse RLS, y
 * quien decide si puede hacerlo es el PIN que comprueba BatakPinGuard antes de
 * llegar aquí.
 */
@Injectable()
export class SupabaseService {
  private readonly url: string;
  private readonly anonKey: string;
  private readonly serviceRoleKey: string;

  private anonClient?: SupabaseClient;
  private adminClient?: SupabaseClient;

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('SUPABASE_URL');
    this.anonKey = config.getOrThrow<string>('SUPABASE_ANON_KEY');
    this.serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  }

  /** Cliente anónimo: solo ve lo que las políticas dejan ver a `anon`. */
  anon(): SupabaseClient {
    this.anonClient ??= createClient(this.url, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return this.anonClient;
  }

  /** Cliente con service_role: se salta RLS. Solo para escrituras ya validadas por el PIN. */
  admin(): SupabaseClient {
    if (!this.serviceRoleKey) {
      throw new InternalServerErrorException(
        'SUPABASE_SERVICE_ROLE_KEY no está configurada, así que el API no puede escribir. ' +
          'Rellénala en apps/api/.env (o en las variables del proyecto de Vercel).',
      );
    }
    this.adminClient ??= createClient(this.url, this.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return this.adminClient;
  }
}
