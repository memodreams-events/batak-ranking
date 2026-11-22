import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { fmtDate } from '@batak/shared';
import { useRanking } from '../hooks/batak';
import { useAuth } from '../hooks/auth';
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

export function BatakLayout() {
  const { evento, online } = useRanking();
  const { email, signOut } = useAuth();
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
            <div className="flex items-center gap-3 text-[13px] text-fg2">
              <span className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${online ? 'bg-ok shadow-[0_0_6px_#4ad67f]' : 'bg-bad'}`}
                />
                {online ? 'En directo' : 'Sin conexión con el servidor'}
              </span>
              {email && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">{email}</span>
                  <button type="button" className="btn btn-sm" onClick={() => void signOut()}>
                    Salir
                  </button>
                </>
              )}
            </div>
          )}
        </div>

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
