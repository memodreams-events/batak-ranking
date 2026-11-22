import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Con las claves sin rellenar la app arranca igual y enseña una pantalla
 * explicando qué falta, en vez de quedarse en blanco con un error de consola.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Este cliente solo inicia y mantiene la sesión. No lee ni escribe datos: desde
 * la migración 0002 las tablas no tienen políticas RLS, así que la anon key no
 * sirve para consultarlas aunque alguien la saque del bundle. Los datos van
 * siempre por el API.
 */
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  },
);
