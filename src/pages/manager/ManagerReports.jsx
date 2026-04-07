import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Download, Calendar, Filter, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

export default function ManagerReports() {
    const { userDepartment } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [users, setUsers] = useState({});
    const [scorecards, setScorecards] = useState([]);
    const [selectedScorecard, setSelectedScorecard] = useState(null);
    const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false);
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

        const unsubTasks = onSnapshot(q, async (snapshot) => {
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

        const qScorecards = query(
            collection(db, 'scorecards'),
            where('managerDepartment', '==', userDepartment)
        );

        const unsubScorecards = onSnapshot(qScorecards, (snapshot) => {
            setScorecards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubTasks();
            unsubScorecards();
        };
    }, [userDepartment]);

    // --- Calculations ---

    // 1. Completion Status
    const isTaskCompleted = (t) => ['completed', 'pending', 'approved', 'flagged', 'rejected'].includes(t.status) || !!t.submissionId;
    const isTaskInProgress = (t) => t.status === 'in-progress';
    const isTaskUnstarted = (t) => !isTaskCompleted(t) && !isTaskInProgress(t);

    const completionStats = [
        { name: 'Completed (Submitted)', value: tasks.filter(isTaskCompleted).length, color: '#16a34a' },
        { name: 'In Progress', value: tasks.filter(isTaskInProgress).length, color: '#2563eb' },
        { name: 'Not Started', value: tasks.filter(isTaskUnstarted).length, color: '#f97316' },
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
                completed: dayTasks.filter(isTaskCompleted).length,
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
            if (isTaskCompleted(task)) {
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
                } else {
                    // Try to deduce duration from submission if available, else standard fallback
                    const submission = submissions.find(s => s.taskId === task.id);
                    if (submission && submission.submittedAt && task.startTime) {
                        const start = task.startTime.toDate ? task.startTime.toDate() : new Date(task.startTime);
                        const end = submission.submittedAt.toDate ? submission.submittedAt.toDate() : new Date(submission.submittedAt);
                        const durationMins = (end - start) / (1000 * 60);
                        if (durationMins > 0) {
                            supervisorMap[name].totalDuration += durationMins;
                            supervisorMap[name].durationCount++;
                        }
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

    const getFieldDataMetrics = () => {
        let metrics = {
            totalCustomerVisits: 0,
            totalSalesVolume: 0,
            totalSalesValue: 0,
            totalSessionsHeld: 0,
            totalParticipantsReached: 0,
            totalCallsMade: 0,
            farmersReached: 0,
            totalSitesVisited: 0
        };

        submissions.forEach(sub => {
            if (sub.status === 'rejected') return;
            const state = sub.checklistState || sub;

            if (sub.checklistType === 'sales-marketing') {
                metrics.totalCustomerVisits += parseInt(state['customer-visits-count']) || 0;
                metrics.totalSalesVolume += parseInt(state['sales-volume-units']) || 0;
                metrics.totalSalesValue += parseInt(state['sales-value-mwk']) || 0;
            } else if (sub.checklistType === 'outreach-engagement') {
                metrics.totalSessionsHeld += parseInt(state['sessions-held-count']) || 0;
                metrics.totalParticipantsReached += parseInt(state['participants-reached']) || 0;
            } else if (sub.checklistType === 'field-monitoring-qa') {
                metrics.totalSitesVisited += parseInt(state['sites-visited-count']) || 0;
            } else if (sub.checklistType === 'data-callcentre-oversight') {
                metrics.totalCallsMade += parseInt(state['calls-made-count']) || 0;
                metrics.farmersReached += parseInt(state['farmers-reached-count']) || 0;
            }
        });

        return metrics;
    };

    const supervisorMetrics = getSupervisorMetrics();
    const fieldDataMetrics = getFieldDataMetrics();

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
                    {userDepartment === 'data-and-field' ? (
                        <TabsTrigger value="field-operations">Field Operations</TabsTrigger>
                    ) : (
                        <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    )}
                    <TabsTrigger value="scorecards">Data Collector Scorecards</TabsTrigger>
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

                {userDepartment === 'data-and-field' && (
                    <TabsContent value="field-operations">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <Card className="bg-blue-50/50 border-blue-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-blue-800">Total Customer Visits</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-900">{fieldDataMetrics.totalCustomerVisits}</div>
                                    <p className="text-xs text-blue-600 mt-1">Sales & Marketing</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-green-50/50 border-green-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-green-800">Sales Volume (Units/Kg)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-900">{fieldDataMetrics.totalSalesVolume}</div>
                                    <p className="text-xs text-green-600 mt-1">Value: {fieldDataMetrics.totalSalesValue} MWK</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-purple-50/50 border-purple-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-purple-800">Farmers Reached</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-purple-900">
                                        {fieldDataMetrics.farmersReached + fieldDataMetrics.totalParticipantsReached}
                                    </div>
                                    <p className="text-xs text-purple-600 mt-1">Call Centre & Outreach</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-pink-50/50 border-pink-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-pink-800">Outreach Sessions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-pink-900">{fieldDataMetrics.totalSessionsHeld}</div>
                                    <p className="text-xs text-pink-600 mt-1">Field Engagement</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-orange-50/50 border-orange-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-orange-800">Calls Made</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-orange-900">{fieldDataMetrics.totalCallsMade}</div>
                                    <p className="text-xs text-orange-600 mt-1">Call Centre Oversight</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-amber-50/50 border-amber-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-amber-800">QA Sites Visited</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-amber-900">{fieldDataMetrics.totalSitesVisited}</div>
                                    <p className="text-xs text-amber-600 mt-1">Field Monitoring</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}

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
                <TabsContent value="scorecards">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Collector Performance Scorecards</CardTitle>
                            <CardDescription>Review submitted evaluation scorecards for data collectors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Staff Name</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Evaluation Date</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Evaluator</th>
                                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Overall Score</th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {scorecards.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">No scorecards found for this department.</td>
                                                </tr>
                                            ) : scorecards.map((card) => (
                                                <tr key={card.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium">{card.staffName || card.staffId}</td>
                                                    <td className="p-4 align-middle">
                                                        {new Date(card.evaluationDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 align-middle">{card.supervisorName}</td>
                                                    <td className="p-4 align-middle text-center">
                                                        <Badge variant={card.overallPerformanceScore >= 80 ? 'outline' : 'secondary'}
                                                            className={card.overallPerformanceScore >= 80 ? 'text-green-600 border-green-200 bg-green-50' : card.overallPerformanceScore < 50 ? 'text-red-600' : ''}>
                                                            {card.overallPerformanceScore}%
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => {
                                                            setSelectedScorecard(card);
                                                            setIsScorecardModalOpen(true);
                                                        }}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </Button>
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

            {/* Detailed Scorecard Modal */}
            <Dialog open={isScorecardModalOpen} onOpenChange={setIsScorecardModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Scorecard Details</DialogTitle>
                        <DialogDescription>
                            Detailed performance review for {selectedScorecard?.staffName}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedScorecard && (
                        <div className="space-y-6 mt-4">
                            {/* Summary header */}
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                                <div>
                                    <h3 className="font-bold text-lg">{selectedScorecard.staffName}</h3>
                                    <p className="text-sm text-muted-foreground">Evaluated by {selectedScorecard.supervisorName} on {new Date(selectedScorecard.evaluationDate).toLocaleDateString()}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-1">Overall</p>
                                    <Badge className="text-lg px-3 py-1">
                                        {selectedScorecard.overallPerformanceScore}%
                                    </Badge>
                                </div>
                            </div>

                            {/* Attendance & Productivity Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="border p-3 rounded text-center">
                                    <p className="text-xs text-muted-foreground uppercase">Scheduled</p>
                                    <p className="text-xl font-bold">{selectedScorecard.daysScheduled || 0}</p>
                                </div>
                                <div className="border p-3 rounded text-center">
                                    <p className="text-xs text-muted-foreground uppercase">Worked</p>
                                    <p className="text-xl font-bold">{selectedScorecard.daysWorked || 0}</p>
                                </div>
                                <div className="border p-3 rounded text-center">
                                    <p className="text-xs text-muted-foreground uppercase">Tasks Assigned</p>
                                    <p className="text-xl font-bold">{selectedScorecard.tasksAssigned || 0}</p>
                                </div>
                                <div className="border p-3 rounded text-center">
                                    <p className="text-xs text-muted-foreground uppercase">Tasks Completed</p>
                                    <p className="text-xl font-bold">{selectedScorecard.tasksCompleted || 0}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Detailed Scores */}
                                <div className="border rounded-md p-4 space-y-3">
                                    <h4 className="font-semibold border-b pb-2 mb-2">Quality & Communication (/5)</h4>
                                    <div className="flex justify-between text-sm"><span>Accuracy</span><span className="font-medium">{selectedScorecard.accuracyScore || 'N/A'}</span></div>
                                    <div className="flex justify-between text-sm"><span>Clarity</span><span className="font-medium">{selectedScorecard.clarityScore || 'N/A'}</span></div>
                                    <div className="flex justify-between text-sm"><span>Professionalism</span><span className="font-medium">{selectedScorecard.professionalCommScore || 'N/A'}</span></div>
                                    <div className="flex justify-between text-sm"><span>Patience</span><span className="font-medium">{selectedScorecard.patienceScore || 'N/A'}</span></div>
                                </div>

                                <div className="border rounded-md p-4 space-y-3">
                                    <h4 className="font-semibold border-b pb-2 mb-2">Conduct & Timeliness (/5)</h4>
                                    <div className="flex justify-between text-sm"><span>Timely Submissions</span><span className="font-medium">{selectedScorecard.timelySubmissionScore || 'N/A'}</span></div>
                                    <div className="flex justify-between text-sm"><span>Deadlines Met</span><span className="font-medium">{selectedScorecard.completionDeadlinesScore || 'N/A'}</span></div>
                                    <div className="flex justify-between text-sm"><span>Team Cooperation</span><span className="font-medium">{selectedScorecard.teamCooperationScore || 'N/A'}</span></div>
                                    <div className="flex justify-between text-sm"><span>Reliability</span><span className="font-medium">{selectedScorecard.reliabilityScore || 'N/A'}</span></div>
                                </div>
                            </div>

                            {/* Supervisor Comments */}
                            <div className="border rounded-md p-4">
                                <h4 className="font-semibold mb-2">Supervisor Comments</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {selectedScorecard.supervisorComments || 'No comments provided.'}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
