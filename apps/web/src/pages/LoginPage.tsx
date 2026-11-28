import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { Logo } from '../components/Logo';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const problema = await signIn(email, password);
    setBusy(false);
    if (problema) setError(problema);
    else void navigate('/ranking', { replace: true });
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
        <Logo className="mx-auto h-10" />
        <h1 className="panel-title mt-6">Falta configurar el acceso</h1>
        <p className="hint">
          No están definidas <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <Logo className="mx-auto h-10" />
        <h1 className="mt-5 font-display text-3xl font-bold uppercase tracking-wide">
          Batak <span className="text-brasa-text">Ranking</span>
        </h1>
        <p className="hint mt-1">Acceso restringido al personal del stand</p>
      </div>

      <form onSubmit={onSubmit} className="panel grid gap-3.5">
        <div className="grid gap-1.5">
          <label htmlFor="email" className="label">
            Correo
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            className="field"
            placeholder="info@memodreams.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="password" className="label">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-bad">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="hint mt-6 text-center">
        ¿Solo quieres ver la clasificación?{' '}
        <a href="/r" className="text-brasa-text underline">
          Ábrela aquí
        </a>
        .
      </p>
    </div>
  );
}
