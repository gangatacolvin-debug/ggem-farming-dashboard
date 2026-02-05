import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';

export default function Sidebar() {
  const { userRole, userDepartment } = useAuth();
  const location = useLocation();

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
        return [
          { name: 'Dashboard', href: '/dashboard/manager', icon: LayoutDashboard },
          { name: 'Task Management', href: '/dashboard/manager/tasks', icon: ClipboardList },
          { name: 'Live Monitoring', href: '/dashboard/manager/monitoring', icon: CheckSquare },
          { name: 'Submissions Review', href: '/dashboard/manager/submissions', icon: FileText },
          { name: 'Schedules', href: '/dashboard/manager/schedules', icon: Calendar },
          { name: 'Team Performance', href: '/dashboard/manager/reports', icon: BarChart3 },
        ];

      case 'supervisor':
        return [
          { name: 'Dashboard', href: '/dashboard/supervisor', icon: LayoutDashboard },
          { name: 'My Tasks', href: '/dashboard/supervisor/tasks', icon: ClipboardList },
          { name: 'My Submissions', href: '/dashboard/supervisor/submissions', icon: FileText },
          { name: 'Active Task', href: '/dashboard/supervisor/active', icon: CheckSquare },
          { name: 'Performance', href: '/dashboard/supervisor/performance', icon: BarChart3 },
        ];

      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <aside className="w-64 bg-primary text-white flex flex-col">
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