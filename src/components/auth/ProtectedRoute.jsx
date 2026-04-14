import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usesFieldWorkerDashboard } from '@/config/fieldPortal';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] — exact role match (e.g. manager)
 * @param {boolean} [props.allowFieldWorkerDashboard] — supervisor or aggregation field roles (security-lead, etc.)
 */
export const ProtectedRoute = ({ children, allowedRoles, allowFieldWorkerDashboard }) => {
  const { currentUser, userRole, userDepartment } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowFieldWorkerDashboard) {
    if (usesFieldWorkerDashboard(userRole, userDepartment)) {
      return children;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};