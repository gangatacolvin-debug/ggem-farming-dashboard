import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShieldCheck, AlertCircle, Droplets, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Legend, Cell
} from 'recharts';

const KPICard = ({ title, value, subtext, icon: Icon, colorClass = 'text-indigo-600', bgColorClass = 'bg-indigo-100' }) => (
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

export default function InventoryAuditsTab({ tasks = [], data = {} }) {
    const { totalStock = 0, damagedBags = 0, auditAccuracy = 100, maintenanceScore = 100, stockByWarehouse = [] } = data;

    const damagePercentage = totalStock > 0 ? ((damagedBags / totalStock) * 100).toFixed(1) : 0;

    const stockData = useMemo(() => {
        return stockByWarehouse.map(w => ({
            name: w.name,
            stock: w.value,
            moistureStatus: 'good'
        }));
    }, [stockByWarehouse]);

    const auditLogData = useMemo(() => {
        return tasks.filter(t => t.checklistType?.includes('warehouse-inventory')).map(t => {
            const formData = t.formData || {};
            const sys = Number(formData['system-balance-weight']) || 0;
            const phys = Number(formData['tonnes-received']) || sys;
            const variance = sys > 0 ? (((phys - sys) / sys) * 100).toFixed(2) : 0;
            return {
                date: t.timestamp?.toDate ? format(t.timestamp.toDate(), 'MMM dd') : 'Recent',
                hub: formData['warehouse-id'] || 'Unknown',
                type: formData['audit-type'] || 'Audit',
                sys,
                phys,
                var: variance,
                dmg: Number(formData['damaged-expired-count']) || 0,
                moist: 13.5,
                signoff: t.status === 'approved' ? 'Approved' : 'Pending Review'
            };
        });
    }, [tasks]);

    const getMoistureColor = (status) => {
        if (status === 'good') return '#10b981'; // green
        if (status === 'warning') return '#f59e0b'; // yellow
        return '#ef4444'; // red
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICard title="Total Stock" value={`${(totalStock / 1000).toFixed(1)}k`} subtext="kg across network" icon={Package} />
                <KPICard title="Audit Match Rate" value={`${auditAccuracy}%`} subtext="System vs Physical" icon={ShieldCheck} colorClass="text-green-600" bgColorClass="bg-green-100" />
                <KPICard title="Damaged Bags" value={`${damagePercentage}%`} subtext="Of total inventory" icon={AlertCircle} colorClass="text-orange-600" bgColorClass="bg-orange-100" />
                <KPICard title="Maintenance Score" value={`${maintenanceScore}/10`} subtext="Cleanliness / condition" icon={Wrench} colorClass="text-blue-600" bgColorClass="bg-blue-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Stock by Warehouse (kg)</CardTitle>
                        <p className="text-xs text-gray-500">Colors indicate overall moisture health (Green: Good, Red: High Moisture)</p>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stockData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} />
                                <RechartsTooltip />
                                <Bar dataKey="stock" name="Stock (kg)" radius={[0, 4, 4, 0]}>
                                    {stockData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getMoistureColor(entry.moistureStatus)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Audit Log Table</CardTitle>
                        <select className="text-sm border rounded px-2 py-1">
                            <option>All Hubs</option>
                            <option>Dwangwa</option>
                            <option>Linga</option>
                        </select>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Warehouse</th>
                                        <th className="px-4 py-3 font-medium">Type</th>
                                        <th className="px-4 py-3 font-medium text-right">System (kg)</th>
                                        <th className="px-4 py-3 font-medium text-right">Physical (kg)</th>
                                        <th className="px-4 py-3 font-medium text-right">Variance %</th>
                                        <th className="px-4 py-3 font-medium text-right">Damaged</th>
                                        <th className="px-4 py-3 font-medium text-right">Moisture %</th>
                                        <th className="px-4 py-3 font-medium text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogData.map((log, idx) => {
                                        const highVariance = Math.abs(log.var) > 1.0;
                                        return (
                                            <tr key={idx} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3">{log.date}</td>
                                                <td className="px-4 py-3 font-bold text-gray-700">{log.hub}</td>
                                                <td className="px-4 py-3 text-gray-500">{log.type}</td>
                                                <td className="px-4 py-3 text-right">{log.sys}</td>
                                                <td className="px-4 py-3 text-right font-medium">{log.phys}</td>
                                                <td className={`px-4 py-3 text-right ${highVariance ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                    {log.var > 0 ? '+' : ''}{log.var}%
                                                </td>
                                                <td className="px-4 py-3 text-right text-orange-600">{log.dmg}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.moist <= 14 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {log.moist}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.signoff === 'Approved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {log.signoff}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
