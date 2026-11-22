import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  email: string | null;
  /** Mientras es true no sabemos aún si hay sesión: no se puede decidir si redirigir. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Traduce los errores de Supabase, que llegan en inglés y poco claros. */
function mensajeDeError(raw: string): string {
  if (/invalid login credentials/i.test(raw)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(raw)) return 'La cuenta aún no está confirmada.';
  if (/too many requests|rate limit/i.test(raw)) return 'Demasiados intentos. Espera un minuto.';
  if (/failed to fetch|network/i.test(raw)) return 'Sin conexión con el servidor.';
  return raw;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    });
    // Mantiene la sesión al día cuando el token se renueva solo, cosa que pasa
    // sin avisar si la TV lleva horas encendida.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      email: session?.user.email ?? null,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return error ? mensajeDeError(error.message) : null;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth fuera de <AuthProvider>');
  return context;
}
