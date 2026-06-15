import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Guards a route. `roles`, when provided, restricts access to those roles;
// a signed-in user with the wrong role is bounced to their home area.
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
