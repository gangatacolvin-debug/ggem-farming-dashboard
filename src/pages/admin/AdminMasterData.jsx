import { useState, useEffect } from 'react';
import { getHubs } from '@/features/admin/lib/adminService';

export default function AdminMasterData() {
  const [hubs, setHubs] = useState([]);

  useEffect(() => {
    const fetchHubs = async () => {
      const data = await getHubs();
      setHubs(data);
    };
    fetchHubs();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
      <p className="text-gray-500 mt-1">Manage hubs and checklists</p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Hubs</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hubs.map(hub => (
              <tr key={hub.id}>
                <td className="px-6 py-4">{hub.name}</td>
                <td className="px-6 py-4">{hub.department}</td>
                <td className="px-6 py-4">{hub.active ? 'Active' : 'Inactive'}</td>
                <td className="px-6 py-4">Actions here</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}