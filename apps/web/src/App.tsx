import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from './lib/api';
import { PinProvider } from './hooks/pin';
import { ToastProvider } from './hooks/toast';
import { BatakLayout } from './components/BatakLayout';
import { ApuntarPage } from './pages/ApuntarPage';
import { EventosPage } from './pages/EventosPage';
import { HistoricoPage } from './pages/HistoricoPage';
import { PublicoPage } from './pages/PublicoPage';
import { RankingPage } from './pages/RankingPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Todo se resondea cada 4 s de todas formas; no hace falta refrescar
      // además al volver a la pestaña.
      refetchOnWindowFocus: false,
      // Un 401 o un 404 no se arreglan reintentando.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

/** Las pantallas del stand: TV, iPad y gestión. Comparten cabecera, PIN y avisos. */
function StandRoutes() {
  return (
    <ToastProvider>
      <PinProvider>
        <Routes>
          <Route element={<BatakLayout />}>
            <Route path="/" element={<Navigate to="/ranking" replace />} />
            <Route path="/ranking" element={<RankingPage />} />
            {/* Misma pantalla que /ranking, en modo TV. */}
            <Route path="/pantalla" element={<RankingPage />} />
            <Route path="/apuntar" element={<ApuntarPage />} />
            <Route path="/eventos" element={<EventosPage />} />
            <Route path="/historico" element={<HistoricoPage />} />
            <Route path="*" element={<Navigate to="/ranking" replace />} />
          </Route>
        </Routes>
      </PinProvider>
    </ToastProvider>
  );
}

/**
 * Rutas públicas, sin login.
 *
 * `/r` es la que se imprime en el QR del stand y queda deliberadamente fuera
 * de PinProvider: el móvil de un participante no tiene nada que preguntar
 * sobre el PIN, así que se ahorra esa petición.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/r" element={<PublicoPage />} />
          <Route path="/*" element={<StandRoutes />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
