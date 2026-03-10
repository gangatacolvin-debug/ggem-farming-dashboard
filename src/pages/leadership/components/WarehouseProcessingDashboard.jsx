import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, AlertTriangle, Factory, Truck, Activity, Target, ShieldCheck, Package } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Legend, Cell, ComposedChart
} from 'recharts';
import { format } from 'date-fns';

import MillingTab from './tabs/MillingTab';
import BriquetteTab from './tabs/BriquetteTab';
import HubTransfersTab from './tabs/HubTransfersTab';
import InventoryAuditsTab from './tabs/InventoryAuditsTab';
import {
    aggregateMillingData, aggregateBriquetteData, aggregateHubTransfersData, aggregateInventoryData
} from '../kpiService';



const KPICard = ({ title, value, subtext, icon: Icon, colorClass = 'text-blue-600', bgColorClass = 'bg-blue-100' }) => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold mt-1">{value}</h3>
                    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-full ${bgColorClass}`}>
                    <Icon className={`w-6 h-6 ${colorClass}`} />
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function WarehouseProcessingDashboard({ tasks, liveTasks }) {
    const [dateRange, setDateRange] = useState('7d');

    const millingData = useMemo(() => aggregateMillingData(tasks), [tasks]);
    const briquetteData = useMemo(() => aggregateBriquetteData(tasks), [tasks]);
    const hubData = useMemo(() => aggregateHubTransfersData(tasks), [tasks]);
    const inventoryData = useMemo(() => aggregateInventoryData(tasks), [tasks]);

    const supervisorData = useMemo(() => {
        const sups = {};
        tasks.forEach(t => {
            const name = t.assignedTo || 'Unassigned';
            if (!sups[name]) sups[name] = { name, submissions: 0, flags: 0, approvals: 0 };
            sups[name].submissions++;
            if (t.status === 'completed' || t.status === 'approved') sups[name].approvals++;
            if (t.locationCompliant === false || (t.formData && t.formData['machinery-inspected'] === false)) sups[name].flags++;
        });
        return Object.values(sups).map(s => ({
            ...s,
            dept: 'Processing/Warehousing',
            approvalRate: s.submissions > 0 ? ((s.approvals / s.submissions) * 100).toFixed(0) : 0
        })).sort((a, b) => b.submissions - a.submissions).slice(0, 5);
    }, [tasks]);

    const weeklyTrendData = useMemo(() => {
        const days = {};
        tasks.forEach(t => {
            const dateStr = t.timestamp?.toDate ? format(t.timestamp.toDate(), 'EEE') : 'Unknown';
            if (dateStr !== 'Unknown') {
                if (!days[dateStr]) days[dateStr] = { name: dateStr, milling: 0, briquette: 0 };
                if (t.checklistType.includes('milling')) days[dateStr].milling += Number(t.formData?.['total-milled']) || Number(t.formData?.['total-milled-rice']) || 0;
                if (t.checklistType.includes('briquette')) days[dateStr].briquette += Number(t.formData?.['actual-output']) || 0;
            }
        });
        return Object.values(days);
    }, [tasks]);

    const activeAlerts = useMemo(() => {
        return hubData.incidentLog.slice(0, 5);
    }, [hubData]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Warehousing & Processing</h2>
                    <p className="text-gray-500 mt-1">Detailed department metrics and trends</p>
                </div>
                <div className="flex gap-4">
                    <select
                        className="bg-white border rounded-md px-3 py-2 text-sm shadow-sm"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">This Quarter</option>
                    </select>
                    <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 space-x-6">
                    <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-2 py-3">Overview</TabsTrigger>
                    <TabsTrigger value="milling" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-2 py-3">Milling</TabsTrigger>
                    <TabsTrigger value="briquette" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-2 py-3">Briquette Production</TabsTrigger>
                    <TabsTrigger value="hubs" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-2 py-3">Hub Transfers</TabsTrigger>
                    <TabsTrigger value="inventory" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-2 py-3">Inventory & Audits</TabsTrigger>
                </TabsList>

                {/* TAB 1: OVERVIEW */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <KPICard title="Total Stock" value={`${(inventoryData.totalStock / 1000).toFixed(1)}k`} subtext="kg across all hubs" icon={Package} />
                        <KPICard title="Total Milled" value={`${(millingData.totalMilled / 1000).toFixed(1)}k`} subtext="kg produced" icon={Activity} />
                        <KPICard title="Briquette Output" value={`${(briquetteData.totalBriquettesProduced / 1000).toFixed(1)}k`} subtext="kg produced" icon={Factory} />
                        <KPICard title="Trips Done" value={hubData.totalTrips} subtext="Transfers completed" icon={Truck} />
                        <KPICard title="Audit Match Rate" value={`${inventoryData.auditAccuracy}%`} subtext="Average compliance" icon={ShieldCheck} />
                        <KPICard title="Active Alerts" value={activeAlerts.length} subtext="Requiring attention" icon={AlertTriangle} colorClass="text-red-600" bgColorClass="bg-red-100" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Output Trend (kg)</CardTitle>
                            </CardHeader>
                            <CardContent className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={weeklyTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="milling" name="Milling" stroke="#3b82f6" strokeWidth={2} />
                                        <Line type="monotone" dataKey="briquette" name="Briquette" stroke="#10b981" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Compliance Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Moisture compliance %</span>
                                                <span className="font-medium">92%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Audit match rate %</span>
                                                <span className="font-medium">98%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Checklist submission rate</span>
                                                <span className="font-medium">85%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-red-200">
                                <CardHeader className="bg-red-50 py-3 border-b border-red-100">
                                    <CardTitle className="text-red-800 text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Active Alerts / Flags
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {activeAlerts.length === 0 ? (
                                        <p className="p-4 text-sm text-gray-500">No critical alerts currently.</p>
                                    ) : (
                                        <ul className="divide-y divide-red-100">
                                            {activeAlerts.map((alert, idx) => (
                                                <li key={idx} className="p-3 text-sm flex items-start flex-col gap-1 hover:bg-red-50/50">
                                                    <div className="flex items-center gap-2 w-full">
                                                        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                                                        <span className="font-semibold text-gray-900">{alert.hub}</span>
                                                        <span className="text-xs text-gray-500 ml-auto">{alert.date}</span>
                                                    </div>
                                                    <span className="text-gray-600 pl-4">{alert.issue}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Supervisor Performance Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">Dept</th>
                                            <th className="px-4 py-3 font-medium">Submissions</th>
                                            <th className="px-4 py-3 font-medium">Approval Rate</th>
                                            <th className="px-4 py-3 font-medium">Flags Raised</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supervisorData.map((sup, idx) => (
                                            <tr key={idx} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium">{sup.name}</td>
                                                <td className="px-4 py-3 text-gray-500">{sup.dept}</td>
                                                <td className="px-4 py-3">{sup.submissions}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sup.approvalRate >= 85 ? 'bg-green-100 text-green-700' :
                                                        sup.approvalRate < 60 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {sup.approvalRate}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{sup.flags}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: MILLING */}
                <TabsContent value="milling" className="mt-6 space-y-6">
                    <MillingTab tasks={tasks} data={millingData} />
                </TabsContent>

                {/* TAB 3: BRIQUETTE */}
                <TabsContent value="briquette" className="mt-6 space-y-6">
                    <BriquetteTab tasks={tasks} data={briquetteData} />
                </TabsContent>

                {/* TAB 4: HUBS */}
                <TabsContent value="hubs" className="mt-6 space-y-6">
                    <HubTransfersTab tasks={tasks} data={hubData} />
                </TabsContent>

                {/* TAB 5: INVENTORY */}
                <TabsContent value="inventory" className="mt-6 space-y-6">
                    <InventoryAuditsTab tasks={tasks} data={inventoryData} />
                </TabsContent>

            </Tabs>
        </div>
    );
}
