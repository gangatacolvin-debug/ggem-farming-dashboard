import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function MainLayout() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-gray-50 fixed inset-0">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content — extra bottom padding on mobile/tablet for the bottom nav bar */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav — mobile & tablet only (hidden on lg+) */}
      <BottomNav />
    </div>
  );
}