import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateProcessingKPIs, calculateWarehousingKPIs, getDepartmentAlerts } from '../kpiService';
import { Activity, AlertTriangle, Package, TrendingUp } from 'lucide-react';
import WarehouseProcessingDashboard from './WarehouseProcessingDashboard';

export default function DepartmentCharts({ activeTab, tasks }) {

    // Only render complete tasks
    const completedTasks = tasks.filter(t => t.status === 'completed');

    if (activeTab === 'overview') {
        const processingKpis = calculateProcessingKPIs(completedTasks);
        const warehousingKpis = calculateWarehousingKPIs(completedTasks);
        const recentAlerts = getDepartmentAlerts(tasks);

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Global Enterprise Output
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm font-medium text-blue-800">Total Milled Rice</p>
                                <h4 className="text-3xl font-bold text-blue-900 mt-2">{processingKpis.totalMilledRiced} <span className="text-base font-normal">kg</span></h4>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <p className="text-sm font-medium text-orange-800">Total Briquettes Output</p>
                                <h4 className="text-3xl font-bold text-orange-900 mt-2">{processingKpis.totalBriquettesProduced} <span className="text-base font-normal">kg</span></h4>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Critical Global Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentAlerts.length === 0 ? (
                            <p className="text-sm text-gray-500">No active critical alerts across departments.</p>
                        ) : (
                            <ul className="space-y-3">
                                {recentAlerts.map(alert => (
                                    <li key={alert.id} className="text-sm p-3 bg-red-50 border border-red-100 rounded text-red-800 flex justify-between">
                                        <span><strong>{alert.checklistName || alert.checklistType}</strong> requires attention.</span>
                                        <span className="text-xs">{alert.assignedTo}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (activeTab === 'warehouse-and-processing') {
        return <WarehouseProcessingDashboard tasks={completedTasks} liveTasks={tasks.filter(t => t.status !== 'completed')} />;
    }

    return null;
}
