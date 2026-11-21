import { useState } from 'react';
import type { FormEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { fmtDate } from '@batak/shared';
import { useRanking } from '../hooks/batak';
import { usePin } from '../hooks/pin';
import { useToast } from '../hooks/toast';
import { Logo } from './Logo';
import { QrPanel } from './QrPanel';
import { Toast } from './Toast';

const LINKS = [
  { to: '/ranking', label: 'Ranking' },
  { to: '/apuntar', label: 'Apuntar' },
  { to: '/eventos', label: 'Eventos' },
  { to: '/historico', label: 'Histórico' },
];

/** Las luces de la pared del Batak: alternas encendida/apagada. */
function Lights() {
  return (
    <div className="grid grid-cols-3 gap-1" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <i
          key={i}
          className={`block h-2.5 w-2.5 rounded-full ${
            i % 2 === 0 ? 'bg-amber shadow-[0_0_8px_#ffb627]' : 'bg-line'
          }`}
        />
      ))}
    </div>
  );
}

function PinForm() {
  const { submit } = usePin();
  const { show } = useToast();
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const ok = await submit(value.trim());
    setError(!ok);
    if (ok) {
      setValue('');
      show('PIN correcto');
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-4 rounded-[10px] border border-dashed border-amber p-3.5"
    >
      <label htmlFor="batak-pin" className="font-semibold">
        Este dispositivo necesita el PIN para apuntar puntuaciones
      </label>
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        <input
          id="batak-pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="PIN"
          className="field max-w-[160px]"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button type="submit" className="btn-primary">
          Entrar
        </button>
        {error && <span className="text-sm text-bad">PIN incorrecto</span>}
      </div>
    </form>
  );
}

export function BatakLayout() {
  const { evento, online } = useRanking();
  const { requerido } = usePin();
  const location = useLocation();
  const navigate = useNavigate();

  /** Modo TV del stand: sin navegación y con el ranking a tamaño pared. */
  const screen = location.pathname.startsWith('/pantalla');

  function exitScreen(): void {
    try {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    } catch {
      /* el navegador no deja salir de pantalla completa: da igual, navegamos igual */
    }
    void navigate('/ranking');
  }

  return (
    <>
      <div className={`mx-auto ${screen ? 'max-w-[1400px]' : 'max-w-[1040px]'} px-4`}>
        {!screen && (
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3 pt-[18px]">
            <div className="flex items-center gap-3">
              <Logo className="h-10" />
              <span className="h-10 w-px bg-line" aria-hidden="true" />
              <Lights />
              <h1 className="font-display text-[28px] font-bold uppercase tracking-wide">
                Batak <span className="text-amber">Ranking</span>
              </h1>
            </div>
            <nav aria-label="Secciones" className="flex flex-wrap gap-1">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3.5 py-2 font-display text-[17px] font-semibold uppercase tracking-wide no-underline ${
                      isActive ? 'bg-amber text-ink' : 'text-fg2 hover:text-fg'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </header>
        )}

        <div
          className={`flex flex-wrap items-center justify-between gap-3 ${screen ? 'pb-2.5 pt-7' : 'py-3.5'}`}
        >
          <div>
            <div className="label">Evento activo</div>
            <h2
              className={`font-display ${screen ? 'text-[44px]' : 'text-[26px]'} ${
                evento ? 'font-semibold' : 'font-medium text-fg2'
              }`}
            >
              {evento ? `${evento.nombre} · ${fmtDate(evento.fecha)}` : 'Sin evento activo'}
            </h2>
          </div>
          {screen ? (
            <Logo className="h-[max(5rem,11vh)]" />
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-fg2">
              <span
                className={`h-2 w-2 rounded-full ${online ? 'bg-ok shadow-[0_0_6px_#4ad67f]' : 'bg-bad'}`}
              />
              <span>{online ? 'En directo' : 'Sin conexión con el servidor'}</span>
            </div>
          )}
        </div>

        {requerido && !screen && <PinForm />}

        <Outlet context={{ screen }} />
      </div>

      {screen && (
        <div className="fixed bottom-3 left-4 opacity-35 transition-opacity hover:opacity-100">
          <button type="button" className="btn btn-sm" onClick={exitScreen}>
            Salir de pantalla grande
          </button>
        </div>
      )}

      {screen && <QrPanel />}

      <Toast />
    </>
  );
}
