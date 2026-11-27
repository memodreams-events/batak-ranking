import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from './lib/api';
import { AuthProvider } from './hooks/auth';
import { ToastProvider } from './hooks/toast';
import { BatakLayout } from './components/BatakLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ApuntarPage } from './pages/ApuntarPage';
import { EventoDetallePage } from './pages/EventoDetallePage';
import { EventosPage } from './pages/EventosPage';
import { HistoricoPage } from './pages/HistoricoPage';
import { LoginPage } from './pages/LoginPage';
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

/**
 * Solo hay dos puertas abiertas: `/r`, la pantalla que abre la gente con el QR,
 * y `/login`. Todo lo demás —la TV, el iPad, los eventos y el histórico— exige
 * sesión, y el API la exige por su cuenta: bloquear únicamente estas rutas
 * sería decorativo.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/r" element={<PublicoPage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<BatakLayout />}>
                  <Route path="/" element={<Navigate to="/ranking" replace />} />
                  <Route path="/ranking" element={<RankingPage />} />
                  {/* Misma pantalla que /ranking, en modo TV. */}
                  <Route path="/pantalla" element={<RankingPage />} />
                  <Route path="/apuntar" element={<ApuntarPage />} />
                  <Route path="/eventos" element={<EventosPage />} />
                  <Route path="/eventos/:id" element={<EventoDetallePage />} />
                  <Route path="/historico" element={<HistoricoPage />} />
                  <Route path="*" element={<Navigate to="/ranking" replace />} />
                </Route>
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
