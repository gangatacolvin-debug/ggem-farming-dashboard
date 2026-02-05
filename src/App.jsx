import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import Unauthorized from '@/pages/Unauthorized';
import SupervisorDashboard from '@/pages/supervisor/SupervisorDashboard';
import TaskDetail from '@/pages/supervisor/TaskDetail';
import ManagerDashboard from '@/pages/manager/ManagerDashboard';
import LiveMonitoring from '@/pages/manager/LiveMonitoring';
import TaskManagement from '@/pages/manager/TaskManagement';
import SubmissionsReview from '@/pages/manager/SubmissionsReview';
import ManagerSchedules from '@/pages/manager/ManagerSchedules';
import ManagerReports from '@/pages/manager/ManagerReports';
import ManagerTaskDetail from '@/pages/manager/ManagerTaskDetail';
import ManagerInventory from '@/pages/manager/ManagerInventory';
import MySubmissions from '@/pages/supervisor/MySubmissions';
import SupervisorPerformance from '@/pages/supervisor/SupervisorPerformance';

// Placeholder dashboard components (we'll create these next)
const AdminDashboard = () => <div className="p-8"><h2 className="text-2xl font-bold">Admin Dashboard</h2><p className="text-gray-600 mt-2">Welcome to the admin dashboard</p></div>;
const LeadershipDashboard = () => <div className="p-8"><h2 className="text-2xl font-bold">Leadership Dashboard</h2><p className="text-gray-600 mt-2">Welcome to the leadership dashboard</p></div>;

// Dashboard Router Component
function DashboardRouter() {
  const { userRole } = useAuth();

  // Redirect to appropriate dashboard based on role
  if (userRole === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  } else if (userRole === 'leadership') {
    return <Navigate to="/dashboard/leadership" replace />;
  } else if (userRole === 'manager') {
    return <Navigate to="/dashboard/manager" replace />;
  } else if (userRole === 'supervisor') {
    return <Navigate to="/dashboard/supervisor" replace />;
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Dashboard Routes with Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Redirect based on role */}
            <Route index element={<DashboardRouter />} />

            {/* Admin Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Leadership Routes */}
            <Route
              path="leadership"
              element={
                <ProtectedRoute allowedRoles={['leadership']}>
                  <LeadershipDashboard />
                </ProtectedRoute>
              }
            />

            {/* Manager Routes */}
            <Route path="manager">
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="monitoring"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <LiveMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tasks"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <TaskManagement />
                  </ProtectedRoute>
                }
              />

              <Route
                path="submissions"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <SubmissionsReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="task/:taskId"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerTaskDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="schedules"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerSchedules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inventory"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerInventory />
                  </ProtectedRoute>
                }
              />
            </Route>





            {/* Supervisor Routes */}
            <Route
              path="supervisor"
              element={
                <ProtectedRoute allowedRoles={['supervisor']}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Supervisor Routes */}
            <Route path="supervisor">
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="task/:taskId"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <TaskDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="submissions"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <MySubmissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="performance"
                element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorPerformance />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;