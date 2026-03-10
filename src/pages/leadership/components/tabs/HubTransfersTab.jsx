import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Navigation, CheckCircle, AlertTriangle, Package } from 'lucide-react';
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

export default function HubTransfersTab({ tasks = [], data = {} }) {
    const { totalTrips = 0, onTimePercentage = 0, hubTableData = [], incidentLog = [] } = data;

    const totalBagsMoved = hubTableData.reduce((acc, hub) => acc + (hub.bagsTransferred || 0), 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICard title="Total Trips" value={totalTrips} subtext="Past 7 days" icon={Truck} />
                <KPICard title="Total Bags Moved" value={`${(totalBagsMoved / 1000).toFixed(1)}k`} subtext="Sacks transferred" icon={Package} colorClass="text-green-600" bgColorClass="bg-green-100" />
                <KPICard title="On-Time Departure %" value={`${onTimePercentage}%`} subtext="Target: >90%" icon={Navigation} colorClass="text-blue-600" bgColorClass="bg-blue-100" />
                <KPICard title="On-Time Arrival %" value={`-`} subtext="Target: >90%" icon={CheckCircle} colorClass="text-indigo-600" bgColorClass="bg-indigo-100" />
                <KPICard title="Incidents Logged" value={incidentLog.length} subtext="Requiring review" icon={AlertTriangle} colorClass="text-red-600" bgColorClass="bg-red-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Trips Map / Hub Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 bg-gray-50 border-b sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Hub Name</th>
                                    <th className="px-4 py-3 font-medium text-right">Trips</th>
                                    <th className="px-4 py-3 font-medium text-right">Bags</th>
                                    <th className="px-4 py-3 font-medium text-right">Avg Moisture</th>
                                    <th className="px-4 py-3 font-medium text-right">Incidents</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hubTableData.map((hub, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-700">{hub.hub}</td>
                                        <td className="px-4 py-3 text-right">-</td>
                                        <td className="px-4 py-3 text-right">{hub.bagsTransferred}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${hub.avgMoisture <= 14 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {hub.avgMoisture}%
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-right ${hub.incidents > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                            {hub.incidents}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>On-Time Performance Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={onTimeTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis domain={['auto', 100]} />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="departure" name="Departure On-Time %" stroke="#3b82f6" strokeWidth={2} />
                                <Line type="monotone" dataKey="arrival" name="Arrival On-Time %" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Moisture Compliance per Hub</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={moistureComplianceData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="name" type="category" width={80} />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="compliant" name="Compliant % (10-15%)" stackId="a" fill="#10b981" />
                                <Bar dataKey="nonCompliant" name="Out of Range %" stackId="a" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-red-200">
                    <CardHeader className="bg-red-50 py-3 border-b border-red-100">
                        <CardTitle className="text-red-800 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Recent Flagged Incidents
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto h-80">
                        <ul className="divide-y divide-red-100">
                            {incidentLog.map((incident, idx) => (
                                <li key={idx} className="p-4 text-sm flex flex-col gap-1">
                                    <span className="font-semibold text-gray-900">{incident.hub} - {incident.date}</span>
                                    <span className="text-gray-600">{incident.issue}</span>
                                    <span className="text-xs text-gray-400 mt-1">Status: {incident.status}</span>
                                </li>
                            ))}
                            {incidentLog.length === 0 && (
                                <li className="p-4 text-sm text-gray-500">No recent incidents logged.</li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Trip Log Table</CardTitle>
                    <select className="text-sm border rounded px-2 py-1">
                        <option>All Hubs</option>
                        <option>Dwangwa</option>
                        <option>Linga</option>
                        <option>Suluwi</option>
                        <option>Salima</option>
                    </select>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Trip ID</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Hub</th>
                                    <th className="px-4 py-3 font-medium">Driver</th>
                                    <th className="px-4 py-3 font-medium text-right">Bags</th>
                                    <th className="px-4 py-3 font-medium text-right">Moisture %</th>
                                    <th className="px-4 py-3 font-medium">Dep Time</th>
                                    <th className="px-4 py-3 font-medium">Arr Time</th>
                                    <th className="px-4 py-3 font-medium">Duration</th>
                                    <th className="px-4 py-3 font-medium">Incidents</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tripLogData.map((trip, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-blue-600">{trip.id}</td>
                                        <td className="px-4 py-3">{trip.date}</td>
                                        <td className="px-4 py-3 font-bold text-gray-700">{trip.hub}</td>
                                        <td className="px-4 py-3 text-gray-500">{trip.driver}</td>
                                        <td className="px-4 py-3 text-right">{trip.bags}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${trip.moisture <= 14 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {trip.moisture}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{trip.dep}</td>
                                        <td className="px-4 py-3">{trip.arr}</td>
                                        <td className="px-4 py-3 text-gray-500">{trip.dur}</td>
                                        <td className={`px-4 py-3 ${trip.incidents !== 'None' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                            {trip.incidents}
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
