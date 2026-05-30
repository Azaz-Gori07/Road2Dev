import { Navigate, useLocation } from 'react-router-dom';
import useZenuxAuth from '../hooks/useZenuxAuth';
import useAuth from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const customAuth = useAuth();
  const zenuxAuth = useZenuxAuth();
  const isAuthenticated = customAuth.isAuthenticated || zenuxAuth.isAuthenticated;
  const loading = customAuth.loading || zenuxAuth.loading;

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
}
