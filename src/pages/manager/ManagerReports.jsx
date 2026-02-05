import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Download, Calendar, Filter, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ManagerReports() {
    const { userDepartment } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week'); // week, month, quarter

    // Fetch users for name resolution
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const userMap = {};
                usersSnapshot.forEach(doc => {
                    const data = doc.data();
                    userMap[doc.id] = data.name || data.email || 'Unknown';
                });
                setUsers(userMap);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        if (!userDepartment) return;

        const q = query(
            collection(db, 'tasks'),
            where('department', '==', userDepartment)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(taskList);

            // Fetch related submissions
            const submissionIds = taskList
                .filter(t => t.submissionId)
                .map(t => t.submissionId);

            if (submissionIds.length > 0) {
                try {
                    const submissionPromises = submissionIds.map(id => getDoc(doc(db, 'submissions', id)));
                    const submissionSnapshots = await Promise.all(submissionPromises);
                    const submissionList = submissionSnapshots
                        .filter(s => s.exists())
                        .map(s => ({ id: s.id, ...s.data() }));
                    setSubmissions(submissionList);
                } catch (err) {
                    console.error("Error fetching submissions for reports", err);
                }
            } else {
                setSubmissions([]);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [userDepartment]);

    // --- Calculations ---

    // 1. Completion Status
    const completionStats = [
        { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#16a34a' },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#2563eb' },
        { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: '#f97316' },
    ];

    // 2. Daily Performance (Last 7 days)
    const getDailyPerformance = () => {
        const days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return days.map(dateStr => {
            const dayTasks = tasks.filter(t => {
                const tDate = t.scheduledDate?.toDate?.()?.toISOString().split('T')[0];
                return tDate === dateStr;
            });
            return {
                name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
                completed: dayTasks.filter(t => t.status === 'completed').length,
                total: dayTasks.length
            };
        });
    };

    // 3. Shift Distribution
    const shiftStats = [
        { name: 'Day Shift', value: tasks.filter(t => t.shift === 'day').length, color: '#facc15' },
        { name: 'Night Shift', value: tasks.filter(t => t.shift === 'night').length, color: '#4f46e5' },
    ];

    // 4. Supervisor Performance Metrics
    const getSupervisorMetrics = () => {
        const supervisorMap = {};

        // Aggregate Task Data
        tasks.forEach(task => {
            const rawId = task.assignedTo || 'Unassigned';
            const name = users[rawId] || rawId;
            if (!supervisorMap[name]) {
                supervisorMap[name] = {
                    name,
                    totalAssigned: 0,
                    completed: 0,
                    totalDuration: 0,
                    durationCount: 0,
                    approved: 0,
                    rejected: 0,
                    submissionsCount: 0,
                    locationCompliant: 0,
                    locationCheckCount: 0,
                    onTimeCount: 0,
                    lateCount: 0
                };
            }

            supervisorMap[name].totalAssigned++;
            if (task.status === 'completed') {
                supervisorMap[name].completed++;

                // Calculate Duration
                if (task.startTime && task.endTime) {
                    const start = task.startTime.toDate ? task.startTime.toDate() : new Date(task.startTime);
                    const end = task.endTime.toDate ? task.endTime.toDate() : new Date(task.endTime);
                    const durationMins = (end - start) / (1000 * 60);
                    if (durationMins > 0) {
                        supervisorMap[name].totalDuration += durationMins;
                        supervisorMap[name].durationCount++;
                    }
                }
            }
        });

        // Integrate Submission Data (Quality & Compliance)
        submissions.forEach(sub => {
            let name = 'Unassigned';
            if (sub.supervisorId && users[sub.supervisorId]) {
                name = users[sub.supervisorId];
            } else if (sub.supervisorInfo?.name) {
                name = sub.supervisorInfo.name;
            } else {
                const task = tasks.find(t => t.id === sub.taskId);
                if (task) {
                    const rawId = task.assignedTo || 'Unassigned';
                    name = users[rawId] || rawId;
                }
            }

            if (supervisorMap[name]) {
                supervisorMap[name].submissionsCount++;

                if (sub.status === 'approved') supervisorMap[name].approved++;
                if (sub.status === 'rejected') supervisorMap[name].rejected++;

                // Location Compliance
                const locData = sub.locationData || sub._location;
                if (locData) {
                    supervisorMap[name].locationCheckCount++;
                    if (locData.compliant) {
                        supervisorMap[name].locationCompliant++;
                    }
                }

                // Schedule Compliance
                if (sub.submittedAt && sub.taskInfo?.scheduledDate) {
                    const submitTime = sub.submittedAt.toDate ? sub.submittedAt.toDate() : new Date(sub.submittedAt);
                    const scheduleTime = sub.taskInfo.scheduledDate.toDate ? sub.taskInfo.scheduledDate.toDate() : new Date(sub.taskInfo.scheduledDate);
                    if (submitTime.toDateString() === scheduleTime.toDateString()) {
                        supervisorMap[name].onTimeCount++;
                    } else {
                        supervisorMap[name].lateCount++;
                    }
                }
            }
        });

        return Object.values(supervisorMap).map(sup => ({
            ...sup,
            completionRate: sup.totalAssigned ? ((sup.completed / sup.totalAssigned) * 100).toFixed(1) : 0,
            avgDuration: sup.durationCount ? Math.round(sup.totalDuration / sup.durationCount) : 0,
            approvalRate: sup.submissionsCount ? ((sup.approved / sup.submissionsCount) * 100).toFixed(1) : 0,
            locationScore: sup.locationCheckCount ? ((sup.locationCompliant / sup.locationCheckCount) * 100).toFixed(1) : 0,
            onTimeRate: sup.submissionsCount ? ((sup.onTimeCount / sup.submissionsCount) * 100).toFixed(1) : 0
        }));
    };

    const supervisorMetrics = getSupervisorMetrics();

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Generating reports...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Performance Reports</h1>
                    <p className="text-gray-600 mt-1">Analytics and insights for {userDepartment}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="efficiency">Team Efficiency</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Completion Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Task Completion Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={completionStats}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {completionStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Daily Trend */}
                        <Card className="col-span-1 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Weekly Throughput</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getDailyPerformance()}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="completed" fill="#16a34a" radius={[4, 4, 0, 0]} name="Completed Tasks" />
                                            <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total Tasks" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Shift Distribution</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[200px] flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={shiftStats} dataKey="value" cx="50%" cy="50%" outerRadius={70}>
                                                {shiftStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                            </Pie>
                                            <Legend />
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Key Metrics</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-gray-600">Average Completion Time</span>
                                        <span className="font-bold">
                                            {submissions.length > 0
                                                ? Math.round(supervisorMetrics.reduce((acc, curr) => acc + curr.avgDuration, 0) / supervisorMetrics.length)
                                                : 0} mins
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-gray-600">Avg Approval Rate</span>
                                        <span className="font-bold text-green-600">
                                            {submissions.length > 0
                                                ? (supervisorMetrics.reduce((acc, curr) => acc + parseFloat(curr.approvalRate), 0) / supervisorMetrics.length).toFixed(1)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2">
                                        <span className="text-gray-600">Location Compliance</span>
                                        <span className="font-bold text-blue-600">
                                            {submissions.length > 0
                                                ? (supervisorMetrics.reduce((acc, curr) => acc + parseFloat(curr.locationScore), 0) / supervisorMetrics.length).toFixed(1)
                                                : 0}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="efficiency">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supervisor Performance</CardTitle>
                            <CardDescription>Detailed breakdown of efficiency and quality by supervisor</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Supervisor</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Assigned</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Completed</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Completion Rate</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Avg Duration</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Approval Rate</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Location Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {supervisorMetrics.map((sup) => (
                                                <tr key={sup.name} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium">{sup.name}</td>
                                                    <td className="p-4 align-middle text-center">{sup.totalAssigned}</td>
                                                    <td className="p-4 align-middle text-center">{sup.completed}</td>
                                                    <td className="p-4 align-middle text-center">
                                                        <Badge variant={parseFloat(sup.completionRate) >= 90 ? 'outline' : 'secondary'}
                                                            className={parseFloat(sup.completionRate) >= 90 ? 'text-green-600 border-green-200 bg-green-50' : ''}>
                                                            {sup.completionRate}%
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle text-center">{sup.avgDuration}m</td>
                                                    <td className="p-4 align-middle text-center">
                                                        <span className={parseFloat(sup.approvalRate) >= 90 ? 'text-green-600 font-bold' : parseFloat(sup.approvalRate) < 70 ? 'text-red-600 font-bold' : 'text-yellow-600 font-bold'}>
                                                            {sup.approvalRate}%
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {parseFloat(sup.locationScore) === 100 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                            {parseFloat(sup.locationScore) < 100 && parseFloat(sup.locationScore) > 0 && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                                            <span>{sup.locationScore}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="compliance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compliance Audits</CardTitle>
                            <CardDescription>Breakdown of location verification and schedule adherence</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Supervisor</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Submissions</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Location Checks</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Valid Location %</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">On-Time Rate</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Late Submissions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {supervisorMetrics.map((sup) => (
                                                <tr key={sup.name} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium">{sup.name}</td>
                                                    <td className="p-4 align-middle text-center">{sup.submissionsCount}</td>
                                                    <td className="p-4 align-middle text-center">{sup.locationCheckCount}</td>
                                                    <td className="p-4 align-middle text-center">
                                                        <span className={parseFloat(sup.locationScore) === 100 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                                            {sup.locationScore}%
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <Badge variant={parseFloat(sup.onTimeRate) >= 90 ? 'default' : 'destructive'}>
                                                            {sup.onTimeRate}%
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle text-center font-medium text-red-500">
                                                        {sup.lateCount}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
