import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { Toaster } from '@/components/ui/sonner';
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
import ManagerScorecard from '@/pages/manager/ManagerScorecard';
import AggregationSessionHub from '@/pages/manager/AggregationSessionHub';
import HubManagement from '@/pages/manager/HubManagement';
import MySubmissions from '@/pages/supervisor/MySubmissions';
import SupervisorPerformance from '@/pages/supervisor/SupervisorPerformance';
import LeadershipDashboard from '@/pages/leadership/LeadershipDashboard';
import LeadershipSectionPlaceholder from '@/pages/leadership/LeadershipSectionPlaceholder';
import AiAnalyticsComingSoon from '@/pages/shared/AiAnalyticsComingSoon';
import { usesFieldWorkerDashboard } from '@/config/fieldPortal';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminMasterData from '@/pages/admin/AdminMasterData';
import AdminAuditLog from '@/pages/admin/AdminAuditLog';      

// Placeholder dashboard components (we'll create these next)
/*const AdminDashboard = () => <div className="p-8"><h2 className="text-2xl font-bold">Admin Dashboard</h2><p className="text-gray-600 mt-2">Welcome to the admin dashboard</p></div>;*/

// Dashboard Router Component
function DashboardRouter() {
  const { userRole, userDepartment } = useAuth();

  if (userRole === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }
  if (userRole === 'leadership') {
    return <Navigate to="/dashboard/leadership" replace />;
  }
  if (userRole === 'manager') {
    return <Navigate to="/dashboard/manager" replace />;
  }
  if (usesFieldWorkerDashboard(userRole, userDepartment)) {
    return <Navigate to="/dashboard/supervisor" replace />;
  }

  return <Navigate to="/unauthorized" replace />;
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
<Route path="admin">
  <Route index element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
  <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
  <Route path="master-data" element={<ProtectedRoute allowedRoles={['admin']}><AdminMasterData /></ProtectedRoute>} />
  <Route path="audit" element={<ProtectedRoute allowedRoles={['admin']}><AdminAuditLog /></ProtectedRoute>} />
</Route>

            {/* Leadership Routes */}
            <Route
              path="leadership"
              element={
                <ProtectedRoute allowedRoles={['leadership']}>
                  <LeadershipDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="leadership/departments"
              element={
                <ProtectedRoute allowedRoles={['leadership']}>
                  <LeadershipSectionPlaceholder
                    title="All Departments"
                    description="Cross-department drill-down lives on the main overview for now."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="leadership/performance"
              element={
                <ProtectedRoute allowedRoles={['leadership']}>
                  <LeadershipSectionPlaceholder
                    title="Performance"
                    description="Scorecards and trends will land here in a follow-up release."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="leadership/reports"
              element={
                <ProtectedRoute allowedRoles={['leadership']}>
                  <LeadershipSectionPlaceholder
                    title="Reports"
                    description="Exportable leadership reports are planned next."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="leadership/ai-insights"
              element={
                <ProtectedRoute allowedRoles={['leadership']}>
                  <AiAnalyticsComingSoon audience="leadership" />
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
              <Route
                path="scorecard"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerScorecard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="aggregation-hub"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <AggregationSessionHub />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hub-management"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <HubManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ai-insights"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <AiAnalyticsComingSoon audience="manager" />
                  </ProtectedRoute>
                }
              />
            </Route>





            {/* Field checklist portal (supervisor + aggregation operational roles) */}
            <Route path="supervisor">
              <Route
                index
                element={
                  <ProtectedRoute allowFieldWorkerDashboard>
                    <SupervisorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="task/:taskId"
                element={
                  <ProtectedRoute allowFieldWorkerDashboard>
                    <TaskDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="submissions"
                element={
                  <ProtectedRoute allowFieldWorkerDashboard>
                    <MySubmissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="performance"
                element={
                  <ProtectedRoute allowFieldWorkerDashboard>
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
      <Toaster />
    </Router>
  );
}

export default App;