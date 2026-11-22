import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Dos clientes con papeles muy distintos.
 *
 * `admin()` (service_role) es el único que toca las tablas. Desde la migración
 * 0002 no hay ninguna política RLS, así que `anon` no lee nada: la anon key
 * viaja en el bundle del navegador y hay que darla por conocida.
 *
 * `anon()` queda solo para validar los tokens de sesión contra Supabase Auth.
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

  /** Cliente anónimo. Solo para hablar con Supabase Auth; no lee tablas. */
  anon(): SupabaseClient {
    this.anonClient ??= createClient(this.url, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return this.anonClient;
  }

  /** Cliente con service_role: se salta RLS. Es el único que accede a los datos. */
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

  /** Valida un access token contra Supabase. Devuelve null si no es válido. */
  async getUserFromToken(
    accessToken: string,
  ): Promise<{ id: string; email: string | null } | null> {
    const { data, error } = await this.anon().auth.getUser(accessToken);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  }
}
