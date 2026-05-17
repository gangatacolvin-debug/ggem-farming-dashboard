import { useState, useEffect } from 'react';
import { getAuditLogs } from '@/features/admin/lib/adminService';
import { useAuth } from '@/context/AuthContext';

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getAuditLogs();
      setLogs(data);
    };
    fetchLogs();
  }, []);

  

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
      <p className="text-gray-500 mt-1">Track all admin actions</p>

      <div className="mt-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map(log => (
              <tr key={log.id}>
                <td className="px-6 py-4 text-sm">{log.actorName}</td>
                <td className="px-6 py-4 text-sm">{log.action}</td>
                <td className="px-6 py-4 text-sm">{log.entityType}</td>
                <td className="px-6 py-4 text-sm">{log.entityName}</td>
                <td className="px-6 py-4 text-sm">
                  {log.createdAt?.toDate().toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}