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
            i % 2 === 0 ? 'bg-brasa shadow-light' : 'bg-line'
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

  // En la TV el contenido se reparte en dos columnas: la clasificación a la
  // izquierda y una franja lateral con la marca y el QR. Antes el QR flotaba
  // encima y tapaba la puntuación de las últimas filas.
  if (screen) {
    return (
      <>
        <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_minmax(200px,22vw)] gap-[max(1.5rem,3vw)] px-[max(1rem,2vw)] pt-[max(0.75rem,1.5vh)]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-4 pb-[max(0.4rem,0.9vh)]">
              <h2
                className={`font-display text-[max(1.6rem,3.1vh)] ${
                  evento ? 'font-semibold' : 'font-medium text-fg2'
                }`}
              >
                {evento ? evento.nombre : 'Sin evento activo'}
              </h2>
              {evento && (
                <p className="text-[max(1rem,1.9vh)] text-fg2">{fmtDate(evento.fecha)}</p>
              )}
            </div>
            <Outlet context={{ screen }} />
          </div>

          <aside className="flex flex-col items-center gap-[max(1rem,2vh)]">
            <Logo className="h-[max(3rem,7vh)]" />
            <QrPanel />
          </aside>
        </div>

        <div className="fixed bottom-3 left-4 opacity-35 transition-opacity focus-within:opacity-100 hover:opacity-100">
          <button type="button" className="btn btn-sm" onClick={exitScreen}>
            Salir de pantalla grande
          </button>
        </div>

        <Toast />
      </>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-[1040px] px-4">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3 pt-[18px]">
          <div className="flex items-center gap-3">
            <Logo className="h-10" />
            <span className="h-10 w-px bg-line" aria-hidden="true" />
            <Lights />
            <h1 className="font-display text-[28px] font-bold uppercase tracking-wide">
              Batak <span className="text-brasa-text">Ranking</span>
            </h1>
          </div>
          <nav aria-label="Secciones" className="flex flex-wrap gap-1">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-base font-semibold no-underline active:translate-y-px ${
                    isActive ? 'bg-brasa text-ink' : 'text-fg2 hover:text-fg'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2
              className={`font-display text-[26px] ${
                evento ? 'font-semibold' : 'font-medium text-fg2'
              }`}
            >
              {evento ? evento.nombre : 'Sin evento activo'}
            </h2>
            {evento && <p className="hint">{fmtDate(evento.fecha)}</p>}
          </div>
          <div className="flex items-center gap-3 text-sm text-fg2">
            <span className={online ? 'font-medium text-ok' : 'font-medium text-bad'}>
              {online ? 'En directo' : 'Sin conexión con el servidor'}
            </span>
            {email && (
              <>
                <span className="hidden sm:inline">{email}</span>
                <button type="button" className="btn btn-sm" onClick={() => void signOut()}>
                  Salir
                </button>
              </>
            )}
          </div>
        </div>

        <Outlet context={{ screen }} />
      </div>

      <Toast />
    </>
  );
}
