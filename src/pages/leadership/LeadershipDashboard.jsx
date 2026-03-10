import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Factory, Activity, AlertTriangle, Briefcase, ChevronRight } from 'lucide-react';
import { DEPARTMENTS_CONFIG, getDepartmentForChecklist } from '@/config/departments';
import DepartmentCharts from './components/DepartmentCharts';

// Reusable KPI Card Component
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

export default function LeadershipDashboard() {
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or department id
    const [liveTasks, setLiveTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch ALL live tasks for the feed
        const qLive = query(
            collection(db, 'tasks'),
            where('status', 'in', ['pending', 'in-progress'])
        );

        const unsubLive = onSnapshot(qLive, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLiveTasks(tasks);
        });

        // Fetch completed submissions for KPI Aggregation (in a real app, constrain to last 30 days)
        const qCompleted = query(
            collection(db, 'submissions')
            // Add date constraints here later
        );

        const unsubCompleted = onSnapshot(qCompleted, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCompletedTasks(tasks);
            setLoading(false);
        });

        return () => {
            unsubLive();
            unsubCompleted();
        };
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500 flex justify-center items-center h-full">Loading Leadership Insights...</div>;
    }

    // Process Data based on Tab
    const filteredLiveTasks = activeTab === 'overview'
        ? liveTasks
        : liveTasks.filter(task => {
            const dept = getDepartmentForChecklist(task.checklistType);
            return dept && dept.id === activeTab;
        });

    const filteredCompletedTasks = activeTab === 'overview'
        ? completedTasks
        : completedTasks.filter(task => {
            const dept = getDepartmentForChecklist(task.checklistType);
            return dept && dept.id === activeTab;
        });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leadership Overview</h1>
                    <p className="text-gray-500 mt-1">Real-time metrics across all GGEM operations</p>
                </div>
            </div>

            {/* Dynamic Department Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-2 border-b">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'overview'
                        ? 'bg-primary text-white'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                >
                    Enterprise Overview
                </button>
                {DEPARTMENTS_CONFIG.map(dept => (
                    <button
                        key={dept.id}
                        onClick={() => setActiveTab(dept.id)}
                        className={`px-4 py-2 font-medium text-sm rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === dept.id
                            ? 'bg-primary text-white'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                    >
                        {dept.name}
                    </button>
                ))}
            </div>

            {/* High Level KPI Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Active Workstreams"
                    value={filteredLiveTasks.length}
                    subtext="Tasks currently in progress"
                    icon={Activity}
                />
                <KPICard
                    title="Submissions (Period)"
                    value={filteredCompletedTasks.length}
                    subtext="Completed workflows"
                    icon={Briefcase}
                    colorClass="text-green-600" bgColorClass="bg-green-100"
                />
                <KPICard
                    title="Teams Active"
                    value={new Set(filteredLiveTasks.map(t => t.assignedTo)).size}
                    subtext="Unique operators today"
                    icon={Users}
                    colorClass="text-purple-600" bgColorClass="bg-purple-100"
                />
                <KPICard
                    title="Active Alerts"
                    value={filteredLiveTasks.filter(t => t.locationCompliant === false).length}
                    subtext="Currently off-site or flagged"
                    icon={AlertTriangle}
                    colorClass="text-red-600" bgColorClass="bg-red-100"
                />
            </div>

            {/* Content Based on Tab */}
            {activeTab === 'overview' ? (
                // 3-Column Layout for Enterprise Overview (Live Feed on Left, KPI/Alerts on Right)
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Side: Dynamic Activity Feed */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Live Operations Feed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {filteredLiveTasks.length === 0 ? (
                                <p className="text-gray-500 text-center py-6">No active operations in this view.</p>
                            ) : (
                                <div className="space-y-4">
                                    {filteredLiveTasks.map(task => {
                                        const dept = getDepartmentForChecklist(task.checklistType);
                                        return (
                                            <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900">{task.checklistName || task.checklistType}</span>
                                                        {dept && (
                                                            <span className={`text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200`}>
                                                                {dept.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                        <span>By: {task.assignedTo || 'Unassigned'}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{task.status}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    {task.checklistProgress?.completedSections && (
                                                        <div className="text-sm font-medium text-blue-600">
                                                            {task.checklistProgress.completedSections.length} Steps Done
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                        {task.lastUpdated?.toDate ? task.lastUpdated.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Side: Specific Metrics */}
                    <div className="space-y-6">
                        <DepartmentCharts activeTab={activeTab} tasks={filteredCompletedTasks} liveTasks={filteredLiveTasks} />
                    </div>
                </div>
            ) : (
                // Full Width Layout for detailed department dashboards
                <div className="w-full">
                    <DepartmentCharts activeTab={activeTab} tasks={filteredCompletedTasks} liveTasks={filteredLiveTasks} />
                </div>
            )}
        </div>
    );
}
