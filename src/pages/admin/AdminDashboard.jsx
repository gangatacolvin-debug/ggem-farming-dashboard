import { useState, useEffect } from 'react';
import { getUsers } from '@/features/admin/lib/adminService';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status === 'inactive').length;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-500 mt-1">Logged in as {currentUser?.email}</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold mt-1">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-3xl font-bold mt-1">{activeUsers}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-500">Inactive Users</p>
          <p className="text-3xl font-bold mt-1">{inactiveUsers}</p>
        </div>
      </div>
    </div>
  );
}