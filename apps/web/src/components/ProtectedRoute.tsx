import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/auth';

/**
 * Deja pasar solo con sesión iniciada.
 *
 * Mientras `loading` es true no se decide nada: si redirigiésemos ya, al
 * recargar la TV se vería un parpadeo al login antes de recuperar la sesión
 * guardada.
 */
export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-fg2">
        <p className="label">Comprobando sesión…</p>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
