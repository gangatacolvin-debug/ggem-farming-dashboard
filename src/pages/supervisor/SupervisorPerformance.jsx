import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function SupervisorPerformance() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAssigned: 0,
        completed: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        completionRate: 0,
        approvalRate: 0,
        onTimeRate: 0,
        avgDuration: 0,
        locationScore: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'tasks'),
            where('assignedTo', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Calculate Metrics
            let totalAssigned = taskList.length;
            let completed = 0;
            let totalDuration = 0;
            let durationCount = 0;

            // For submission based metrics
            const submissionIds = taskList.filter(t => t.submissionId).map(t => t.submissionId);
            let submissions = [];

            if (submissionIds.length > 0) {
                try {
                    const promises = submissionIds.map(id => getDoc(doc(db, 'submissions', id)));
                    const snapshots = await Promise.all(promises);
                    submissions = snapshots.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }));
                } catch (err) {
                    console.error("Error fetching submissions", err);
                }
            }

            let approved = 0;
            let rejected = 0;
            let pending = 0;
            let onTimeCount = 0;
            let locationCompliantCount = 0;
            let locationCheckCount = 0;

            // Task Stats
            taskList.forEach(task => {
                if (task.status === 'completed') {
                    completed++;

                    if (task.startTime && task.endTime) {
                        const start = task.startTime.toDate ? task.startTime.toDate() : new Date(task.startTime);
                        const end = task.endTime.toDate ? task.endTime.toDate() : new Date(task.endTime);
                        const duration = (end - start) / (1000 * 60);
                        if (duration > 0) {
                            totalDuration += duration;
                            durationCount++;
                        }
                    }
                }
            });

            // Submission Stats
            submissions.forEach(sub => {
                if (sub.status === 'approved') approved++;
                if (sub.status === 'rejected') rejected++;
                if (sub.status === 'pending') pending++;

                // On Time
                if (sub.submittedAt && sub.taskInfo?.scheduledDate) {
                    const submitTime = sub.submittedAt.toDate ? sub.submittedAt.toDate() : new Date(sub.submittedAt);
                    const scheduleTime = sub.taskInfo.scheduledDate.toDate ? sub.taskInfo.scheduledDate.toDate() : new Date(sub.taskInfo.scheduledDate);
                    if (submitTime.toDateString() === scheduleTime.toDateString()) {
                        onTimeCount++;
                    }
                }

                // Location
                const locData = sub.locationData || sub._location;
                if (locData) {
                    locationCheckCount++;
                    if (locData.compliant) {
                        locationCompliantCount++;
                    }
                }
            });

            const totalSubmissions = submissions.length;

            setStats({
                totalAssigned,
                completed,
                approved,
                rejected,
                pending,
                completionRate: totalAssigned ? Math.round((completed / totalAssigned) * 100) : 0,
                approvalRate: totalSubmissions ? Math.round((approved / totalSubmissions) * 100) : 0,
                onTimeRate: totalSubmissions ? Math.round((onTimeCount / totalSubmissions) * 100) : 0,
                avgDuration: durationCount ? Math.round(totalDuration / durationCount) : 0,
                locationScore: locationCheckCount ? Math.round((locationCompliantCount / locationCheckCount) * 100) : 0
            });

            setRecentActivity(submissions.sort((a, b) => (b.submittedAt?.toMillis?.() || 0) - (a.submittedAt?.toMillis?.() || 0)).slice(0, 5));
            setLoading(false);

            // Prepare Weekly Data (Mock or calculated)
            // Simplified for now - just showing last 7 days of tasks
            const days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const weekly = days.map(dateStr => {
                const dayTasks = taskList.filter(t => {
                    const tDate = t.scheduledDate?.toDate?.()?.toISOString().split('T')[0];
                    return tDate === dateStr;
                });
                return {
                    day: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
                    completed: dayTasks.filter(t => t.status === 'completed').length,
                    total: dayTasks.length
                };
            });
            setWeeklyData(weekly);

        });

        return () => unsubscribe();
    }, [currentUser]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your performance stats...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/dashboard/supervisor')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Performance</h1>
                    <p className="text-gray-600">Track your efficiency and quality metrics</p>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completionRate}%</div>
                        <p className="text-xs text-gray-500">{stats.completed} of {stats.totalAssigned} tasks</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Approval Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.approvalRate >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                            {stats.approvalRate}%
                        </div>
                        <p className="text-xs text-gray-500">{stats.approved} approved, {stats.rejected} rejected</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">On-Time Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.onTimeRate}%</div>
                        <p className="text-xs text-gray-500">Submitted on schedule</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Location Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.locationScore}%</div>
                        <p className="text-xs text-gray-500">Valid GPS checks</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Activity Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Weekly Activity</CardTitle>
                        <CardDescription>Your task completion over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="completed" fill="#16a34a" radius={[4, 4, 0, 0]} name="Completed" />
                                    <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Assigned" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Submissions Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Feedback</CardTitle>
                        <CardDescription>Latest reviews from managers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No submissions yet.</p>
                            ) : (
                                recentActivity.map((sub) => (
                                    <div key={sub.id} className="flex items-start gap-4 p-3 border rounded-lg bg-gray-50">
                                        {sub.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />}
                                        {sub.status === 'rejected' && <XCircle className="w-5 h-5 text-red-500 mt-1" />}
                                        {sub.status === 'pending' && <Clock className="w-5 h-5 text-orange-500 mt-1" />}

                                        <div>
                                            <p className="text-sm font-medium">{sub.checklistType?.replace(/-/g, ' ')}</p>
                                            <p className="text-xs text-gray-500">
                                                {sub.submittedAt?.toDate().toLocaleDateString()}
                                            </p>
                                            {sub.reviewNotes && (
                                                <p className="text-xs mt-1 text-gray-700 bg-white p-1 rounded border">
                                                    "{sub.reviewNotes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
