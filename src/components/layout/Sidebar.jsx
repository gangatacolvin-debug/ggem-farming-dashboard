import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usesFieldWorkerDashboard } from '@/config/fieldPortal';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  BarChart3,
  Settings,
  Building2,
  CheckSquare,
  FileText,
  Package,
  MapPin
} from 'lucide-react';

export default function Sidebar() {
  const { userRole, userDepartment } = useAuth();
  const location = useLocation();
  const isFieldWorker = usesFieldWorkerDashboard(userRole, userDepartment);

  // Navigation items based on role
  const getNavigationItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
          { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
          { name: 'Departments', href: '/dashboard/admin/departments', icon: Building2 },
          { name: 'Schedule Management', href: '/dashboard/admin/schedules', icon: Calendar },
          { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
          { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
        ];

      case 'leadership':
        return [
          { name: 'Dashboard', href: '/dashboard/leadership', icon: LayoutDashboard },
          { name: 'All Departments', href: '/dashboard/leadership/departments', icon: Building2 },
          { name: 'Performance', href: '/dashboard/leadership/performance', icon: BarChart3 },
          { name: 'Reports', href: '/dashboard/leadership/reports', icon: FileText },
        ];

      case 'manager':
        const managerNav = [
          { name: 'Dashboard', href: '/dashboard/manager', icon: LayoutDashboard },
          { name: 'Task Management', href: '/dashboard/manager/tasks', icon: ClipboardList },
          { name: 'Live Monitoring', href: '/dashboard/manager/monitoring', icon: CheckSquare },
          { name: 'Submissions Review', href: '/dashboard/manager/submissions', icon: FileText },
          { name: 'Schedules', href: '/dashboard/manager/schedules', icon: Calendar },
          { name: 'Team Performance', href: '/dashboard/manager/reports', icon: BarChart3 },
          { name: 'Inventory', href: '/dashboard/manager/inventory', icon: Package },
        ];

        if (userDepartment === 'aggregation') {
          managerNav.push({ name: 'Aggregation Hub', href: '/dashboard/manager/aggregation-hub', icon: CheckSquare });
          managerNav.push({ name: 'Hub Management', href: '/dashboard/manager/hub-management', icon: MapPin });
        }

        if (userDepartment === 'data-and-field') {
          managerNav.push({ name: 'Collector Scorecard', href: '/dashboard/manager/scorecard', icon: ClipboardList });
        }

        return managerNav;

      default:
        if (isFieldWorker) {
          return [
            { name: 'My dashboard', href: '/dashboard/supervisor', icon: LayoutDashboard },
            { name: 'My submissions', href: '/dashboard/supervisor/submissions', icon: FileText },
            { name: 'Performance', href: '/dashboard/supervisor/performance', icon: BarChart3 },
          ];
        }
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <aside className="hidden lg:flex w-64 bg-primary text-white flex-col">
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-primary">GG</span>
          </div>
          <span className="text-lg font-semibold">GGEM Farming</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-white/50 text-center">
          © 2025 GGEM Farming
        </p>
      </div>
    </aside>
  );
}