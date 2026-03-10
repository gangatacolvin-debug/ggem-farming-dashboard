import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Beaker, Clock, Scale, Target } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Legend
} from 'recharts';

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

export default function MillingTab({ tasks = [], data = {} }) {
    const { totalMilled = 0, totalUnmilled = 0, totalBroken = 0, totalDowntime = 0, yieldTrendData = [] } = data;

    const yieldPercentage = totalUnmilled > 0 ? ((totalMilled / totalUnmilled) * 100).toFixed(1) : 0;
    const brokenPercentage = totalMilled > 0 ? ((totalBroken / totalMilled) * 100).toFixed(1) : 0;

    const outputBreakdownData = useMemo(() => {
        return tasks.filter(t => t.checklistType?.includes('milling')).map((t, idx) => {
            const formData = t.formData || {};
            return {
                name: formData['shift-type'] || formData['shift'] || `Batch ${idx + 1}`,
                milled: Number(formData['total-milled']) || Number(formData['total-milled-rice']) || 0,
                broken: Number(formData['total-broken']) || 0,
                bran: Number(formData['total-bran']) || 0,
                dust: Number(formData['total-dust']) || 0
            };
        }).slice(0, 10);
    }, [tasks]);

    const downtimeData = useMemo(() => {
        return [
            { reason: 'Total Recorded', hours: (totalDowntime / 60).toFixed(1) }
        ];
    }, [totalDowntime]);

    const shiftData = useMemo(() => {
        return tasks.filter(t => t.checklistType?.includes('milling')).map(t => {
            const formData = t.formData || {};
            const paddy = Number(formData['total-unmilled']) || 0;
            const milled = Number(formData['total-milled']) || Number(formData['total-milled-rice']) || 0;
            const broken = Number(formData['total-broken']) || 0;
            return {
                shift: formData['shift-type'] || formData['shift'] || 'Unknown',
                sup: formData['supervisor-name'] || formData['supervisorName'] || t.assignedTo || 'Unassigned',
                paddy,
                yield: paddy > 0 ? ((milled / paddy) * 100).toFixed(1) : 0,
                broken: milled > 0 ? ((broken / milled) * 100).toFixed(1) : 0,
                down: (Number(formData['total-downtime']) / 60).toFixed(1) || 0
            };
        });
    }, [tasks]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICard title="Total Paddy Fed" value={`${(totalUnmilled / 1000).toFixed(1)}k`} subtext="kg processed" icon={Scale} />
                <KPICard title="Total Milled Rice" value={`${(totalMilled / 1000).toFixed(1)}k`} subtext="kg output" icon={Activity} colorClass="text-green-600" bgColorClass="bg-green-100" />
                <KPICard title="Avg Yield %" value={`${yieldPercentage}%`} subtext="Target: 65%" icon={Target} colorClass="text-purple-600" bgColorClass="bg-purple-100" />
                <KPICard title="Avg % Broken Rice" value={`${brokenPercentage}%`} subtext="Quality indicator" icon={Beaker} colorClass="text-orange-600" bgColorClass="bg-orange-100" />
                <KPICard title="Total Downtime" value={`${(totalDowntime / 60).toFixed(1)} hrs`} subtext="Across all shifts" icon={Clock} colorClass="text-red-600" bgColorClass="bg-red-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Yield Ratio Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={yieldTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="time" />
                                <YAxis domain={['auto', 'auto']} />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="yield" name="Actual Yield %" stroke="#3b82f6" strokeWidth={2} />
                                <Line type="monotone" dataKey="target" name="Target Yield %" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Output Breakdown per Shift</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={outputBreakdownData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="milled" name="Milled Rice" stackId="a" fill="#3b82f6" />
                                <Bar dataKey="broken" name="Broken Rice" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="bran" name="Bran" stackId="a" fill="#10b981" />
                                <Bar dataKey="dust" name="Dust/Stones" stackId="a" fill="#6b7280" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Downtime Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={downtimeData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="reason" type="category" width={120} />
                                <RechartsTooltip />
                                <Bar dataKey="hours" name="Hours" fill="#ef4444" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hourly Production Heatmap</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 flex items-center justify-center bg-gray-50 border rounded-md m-4 mt-0">
                        <div className="text-center">
                            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">Heatmap Visualization</p>
                            <p className="text-sm text-gray-400">Requires production hourly logs</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Shift Comparison Table</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Shift</th>
                                    <th className="px-4 py-3 font-medium">Supervisor</th>
                                    <th className="px-4 py-3 font-medium text-right">Paddy Fed (kg)</th>
                                    <th className="px-4 py-3 font-medium text-right">Yield %</th>
                                    <th className="px-4 py-3 font-medium text-right">Broken %</th>
                                    <th className="px-4 py-3 font-medium text-right">Downtime (hrs)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shiftData.map((shift, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{shift.shift}</td>
                                        <td className="px-4 py-3 text-gray-500">{shift.sup}</td>
                                        <td className="px-4 py-3 text-right">{shift.paddy}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${shift.yield >= 65 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {shift.yield}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">{shift.broken}%</td>
                                        <td className={`px-4 py-3 text-right ${shift.down > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                            {shift.down}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
