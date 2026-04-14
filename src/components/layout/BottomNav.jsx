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
  MapPin,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const { userRole, userDepartment, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isFieldWorker = usesFieldWorkerDashboard(userRole, userDepartment);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const getNavigationItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
          { name: 'Users', href: '/dashboard/admin/users', icon: Users },
          { name: 'Schedule', href: '/dashboard/admin/schedules', icon: Calendar },
          { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
        ];

      case 'leadership':
        return [
          { name: 'Dashboard', href: '/dashboard/leadership', icon: LayoutDashboard },
          { name: 'Departments', href: '/dashboard/leadership/departments', icon: Building2 },
          { name: 'Performance', href: '/dashboard/leadership/performance', icon: BarChart3 },
          { name: 'Reports', href: '/dashboard/leadership/reports', icon: FileText },
        ];

      case 'manager': {
        const items = [
          { name: 'Home', href: '/dashboard/manager', icon: LayoutDashboard },
          { name: 'Tasks', href: '/dashboard/manager/tasks', icon: ClipboardList },
          { name: 'Monitor', href: '/dashboard/manager/monitoring', icon: CheckSquare },
          { name: 'Review', href: '/dashboard/manager/submissions', icon: FileText },
          { name: 'Reports', href: '/dashboard/manager/reports', icon: BarChart3 },
        ];
        if (userDepartment === 'aggregation') {
          items.push({ name: 'Hub', href: '/dashboard/manager/aggregation-hub', icon: MapPin });
        }
        return items;
      }

      default:
        if (isFieldWorker) {
          return [
            { name: 'Dashboard', href: '/dashboard/supervisor', icon: LayoutDashboard },
            { name: 'Submissions', href: '/dashboard/supervisor/submissions', icon: FileText },
            { name: 'Performance', href: '/dashboard/supervisor/performance', icon: BarChart3 },
          ];
        }
        return [];
    }
  };

  const items = getNavigationItems();
  if (!items.length) return null;

  // Truncate to max 5 items on bottom nav + logout
  const visibleItems = items.slice(0, 4);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="flex items-stretch">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/dashboard/supervisor' &&
              item.href !== '/dashboard/manager' &&
              item.href !== '/dashboard/admin' &&
              item.href !== '/dashboard/leadership' &&
              location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-medium transition-all duration-200 min-w-0',
                isActive
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-700'
              )}
            >
              {/* Active indicator pill */}
              <div className={cn(
                'relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                isActive ? 'bg-primary/10' : ''
              )}>
                <Icon className={cn('w-5 h-5 transition-all', isActive ? 'scale-110' : '')} />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
              <span className="truncate w-full text-center leading-none">{item.name}</span>
            </Link>
          );
        })}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-medium text-gray-400 hover:text-red-500 transition-all duration-200 min-w-0"
        >
          <div className="flex items-center justify-center w-10 h-7">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="truncate w-full text-center leading-none">Logout</span>
        </button>
      </div>

      {/* Safe area for devices with home indicator (iPhone-style) */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
