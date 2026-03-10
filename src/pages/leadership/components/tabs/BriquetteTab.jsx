import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Factory, Droplets, Clock, Package, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { getValue } from '../../kpiService';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Legend, Cell
} from 'recharts';

const KPICard = ({ title, value, subtext, icon: Icon, colorClass = 'text-orange-600', bgColorClass = 'bg-orange-100' }) => (
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

export default function BriquetteTab({ tasks = [], data = {} }) {
    const { totalBriquettesProduced = 0, totalHuskUsed = 0, avgAshContent = 0, efficiencyTrend = [], downtimeData = [], totalFuelUsed = 0 } = data;

    const avgHuskEfficiency = totalHuskUsed > 0 ? ((totalBriquettesProduced / totalHuskUsed) * 100).toFixed(1) : 0;

    const outputData = useMemo(() => {
        return tasks.filter(t => t.checklistType?.includes('briquette')).map((t, idx) => {
            return {
                name: getValue(t, 'shift-type') || getValue(t, 'shift') || `Shift ${idx + 1}`,
                actual: Number(getValue(t, 'actual-output')) || Number(getValue(t, 'totalOutput')) || 0,
                target: Number(getValue(t, 'SHIFT_TARGET')) || Number(getValue(t, 'target')) || 2500
            };
        }).slice(0, 10);
    }, [tasks]);

    const shiftData = useMemo(() => {
        return tasks.filter(t => t.checklistType?.includes('briquette')).map(t => {
            const output = Number(getValue(t, 'actual-output')) || Number(getValue(t, 'totalOutput')) || 0;
            return {
                date: t.submittedAt?.toDate ? format(t.submittedAt.toDate(), 'MMM dd') : (t.timestamp?.toDate ? format(t.timestamp.toDate(), 'MMM dd') : 'Recent'),
                shift: getValue(t, 'shift-type') || getValue(t, 'shift') || 'Unknown',
                sup: t.supervisorId || t.assignedTo || 'Unassigned',
                output,
                target: Number(getValue(t, 'SHIFT_TARGET')) || 2500,
                huskUsed: Number(getValue(t, 'total-husk-used')) || Number(getValue(t, 'totalHuskUsed')) || 0,
                fuelUsed: Number(getValue(t, 'fuel-consumed')) || Number(getValue(t, 'totalFuelUsed')) || 0,
                huskEff: Number(getValue(t, 'husk-moisture')) || Number(getValue(t, 'huskEfficiency')) || 0,
                fuelEff: Number(getValue(t, 'fuelEfficiency')) || 0,
                down: Number(getValue(t, 'totalDowntime')) || Number(getValue(t, 'total-downtime')) || 0
            };
        });
    }, [tasks]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICard title="Total Output" value={`${(totalBriquettesProduced / 1000).toFixed(1)}k`} subtext="kg briquettes" icon={Factory} />
                <KPICard title="Avg Husk Efficiency" value={`${avgHuskEfficiency}%`} subtext="Target: >80%" icon={Activity} colorClass="text-green-600" bgColorClass="bg-green-100" />
                <KPICard title="Fuel Used" value={`${totalFuelUsed} L`} subtext="Across all shifts" icon={Droplets} colorClass="text-blue-600" bgColorClass="bg-blue-100" />
                <KPICard title="Total Downtime" value={`${downtimeData.reduce((acc, d) => acc + d.hours, 0)} hrs`} subtext="Aggregated total" icon={Clock} colorClass="text-red-600" bgColorClass="bg-red-100" />
                <KPICard title="Bags Packaged" value={Math.floor(totalBriquettesProduced / 50)} subtext="50kg sacks" icon={Package} colorClass="text-amber-600" bgColorClass="bg-amber-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Output vs Target</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={outputData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                <Legend />
                                <Bar dataKey="target" name="Target (kg)" fill="#e5e7eb" />
                                <Bar dataKey="actual" name="Actual (kg)">
                                    {outputData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.actual >= entry.target ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Efficiency Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={efficiencyTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="efficiency" name="Husk Efficiency %" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Downtime Log Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={downtimeData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="reason" type="category" width={140} />
                                <RechartsTooltip />
                                <Bar dataKey="hours" name="Hours" fill="#ef4444" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quality Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" orientation="left" stroke="#6b7280" />
                                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" domain={['auto', 'auto']} />
                                <RechartsTooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="ash" name="Ash Content %" stroke="#6b7280" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="calorific" name="Calorific Value" stroke="#f59e0b" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Shift Performance Table</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Shift</th>
                                    <th className="px-4 py-3 font-medium">Supervisor</th>
                                    <th className="px-4 py-3 font-medium text-right">Output (kg)</th>
                                    <th className="px-4 py-3 font-medium text-right">vs Target</th>
                                    <th className="px-4 py-3 font-medium text-right">Husk (kg)</th>
                                    <th className="px-4 py-3 font-medium text-right">Fuel (L)</th>
                                    <th className="px-4 py-3 font-medium text-right">Husk Eff</th>
                                    <th className="px-4 py-3 font-medium text-right">Fuel Eff</th>
                                    <th className="px-4 py-3 font-medium text-right">Downtime</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shiftData.map((row, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3">{row.date}</td>
                                        <td className="px-4 py-3 font-medium">{row.shift}</td>
                                        <td className="px-4 py-3 text-gray-500">{row.sup}</td>
                                        <td className="px-4 py-3 text-right font-medium">{row.output}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.output >= row.target ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {row.output - row.target}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500">{row.huskUsed}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">{row.fuelUsed}</td>
                                        <td className="px-4 py-3 text-right">{row.huskEff}</td>
                                        <td className="px-4 py-3 text-right">{row.fuelEff}</td>
                                        <td className={`px-4 py-3 text-right ${row.down > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                            {row.down > 0 ? `${row.down}h` : '-'}
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
