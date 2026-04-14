import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, Activity, AlertTriangle, Briefcase } from 'lucide-react';
import { useResolveUserNames } from './hooks/useResolveUserNames';
import { DEPARTMENTS_CONFIG, getDepartmentForChecklist } from '@/config/departments';
import DepartmentCharts from './components/DepartmentCharts';
import LiveOperationsFeed from './components/LiveOperationsFeed';
import ActiveAggregationSessions from './components/ActiveAggregationSessions';
import LeadershipDepartmentPanel from './components/LeadershipDepartmentPanel';

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

function countLiveTasksByDepartment(liveTasks) {
    const counts = {};
    DEPARTMENTS_CONFIG.forEach((d) => {
        counts[d.id] = 0;
    });
    liveTasks.forEach((task) => {
        const dept = getDepartmentForChecklist(task.checklistType);
        if (dept && counts[dept.id] != null) {
            counts[dept.id] += 1;
        }
    });
    return counts;
}

export default function LeadershipDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [liveTasks, setLiveTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [aggregationSessions, setAggregationSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataErrors, setDataErrors] = useState({});

    useEffect(() => {
        const qLive = query(
            collection(db, 'tasks'),
            where('status', 'in', ['pending', 'in-progress'])
        );

        const unsubLive = onSnapshot(
            qLive,
            (snapshot) => {
                const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setLiveTasks(tasks);
                setDataErrors((prev) => {
                    const next = { ...prev };
                    delete next.liveTasks;
                    return next;
                });
            },
            (err) => {
                console.error('Leadership live tasks:', err);
                setDataErrors((prev) => ({
                    ...prev,
                    liveTasks: 'Live tasks feed failed to load (check rules or network).',
                }));
            }
        );

        const qCompleted = query(collection(db, 'submissions'));

        const unsubCompleted = onSnapshot(
            qCompleted,
            (snapshot) => {
                const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setCompletedTasks(tasks);
                setLoading(false);
                setDataErrors((prev) => {
                    const next = { ...prev };
                    delete next.submissions;
                    return next;
                });
            },
            (err) => {
                console.error('Leadership submissions:', err);
                setLoading(false);
                setDataErrors((prev) => ({
                    ...prev,
                    submissions: 'Submissions stream failed (KPIs and charts may be empty).',
                }));
            }
        );

        const qAgg = query(
            collection(db, 'aggregationSessions'),
            where('department', '==', 'aggregation')
        );

        const unsubAgg = onSnapshot(
            qAgg,
            (snapshot) => {
                const list = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => {
                        const ta = a.createdAt?.toMillis?.() || 0;
                        const tb = b.createdAt?.toMillis?.() || 0;
                        return tb - ta;
                    });
                setAggregationSessions(list);
                setDataErrors((prev) => {
                    const next = { ...prev };
                    delete next.aggregationSessions;
                    return next;
                });
            },
            (err) => {
                console.error('Leadership aggregation sessions:', err);
                setDataErrors((prev) => ({
                    ...prev,
                    aggregationSessions: 'Aggregation sessions could not be loaded.',
                }));
            }
        );

        return () => {
            unsubLive();
            unsubCompleted();
            unsubAgg();
        };
    }, []);

    const liveByDept = useMemo(() => countLiveTasksByDepartment(liveTasks), [liveTasks]);

    const liveAssigneeUids = useMemo(
        () => liveTasks.map((t) => t.assignedTo).filter((id) => typeof id === 'string' && id.length > 0),
        [liveTasks]
    );
    const assigneeNames = useResolveUserNames(liveAssigneeUids);

    const activeAggSessions = useMemo(
        () => aggregationSessions.filter((s) => s.status === 'active'),
        [aggregationSessions]
    );

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500 flex justify-center items-center h-full">
                Loading Leadership Insights...
            </div>
        );
    }

    const filteredLiveTasks =
        activeTab === 'overview'
            ? liveTasks
            : liveTasks.filter((task) => {
                  const dept = getDepartmentForChecklist(task.checklistType);
                  return dept && dept.id === activeTab;
              });

    const filteredCompletedTasks =
        activeTab === 'overview'
            ? completedTasks
            : completedTasks.filter((task) => {
                  const dept = getDepartmentForChecklist(task.checklistType);
                  return dept && dept.id === activeTab;
              });

    const overviewLivePulse = liveTasks.length + activeAggSessions.length;

    const workstreamSubtext =
        activeTab === 'aggregation' && activeAggSessions.length > 0
            ? `${filteredLiveTasks.length} tasks · ${activeAggSessions.length} live hub session(s)`
            : 'Tasks currently in progress';

    const deptConfig = DEPARTMENTS_CONFIG.find((d) => d.id === activeTab);

    const overviewMainColumn = (
        <div className="space-y-6">
            <ActiveAggregationSessions sessions={aggregationSessions} variant="inline" />
            <LiveOperationsFeed
                tasks={filteredLiveTasks}
                title="Live Operations Feed"
                showDepartmentBadge
                assigneeNames={assigneeNames}
            />
        </div>
    );

    const errorList = Object.values(dataErrors).filter(Boolean);

    return (
        <div className="space-y-6">
            {errorList.length > 0 && (
                <Alert variant="destructive">
                    <AlertTitle>Some data could not load</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                            {errorList.map((msg, i) => (
                                <li key={i}>{msg}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leadership Overview</h1>
                    <p className="text-gray-500 mt-1">Real-time metrics across all GGEM operations</p>
                </div>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2 border-b">
                <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap inline-flex items-center gap-2 ${
                        activeTab === 'overview'
                            ? 'bg-primary text-white'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    Enterprise Overview
                    {overviewLivePulse > 0 && (
                        <Badge
                            variant="secondary"
                            className={
                                activeTab === 'overview'
                                    ? 'bg-white/20 text-white border-0'
                                    : 'bg-emerald-100 text-emerald-800'
                            }
                        >
                            {overviewLivePulse}
                        </Badge>
                    )}
                </button>
                {DEPARTMENTS_CONFIG.map((dept) => {
                    const taskCount = liveByDept[dept.id] || 0;
                    const sessionExtra = dept.id === 'aggregation' ? activeAggSessions.length : 0;
                    const badgeCount = taskCount + sessionExtra;
                    return (
                        <button
                            type="button"
                            key={dept.id}
                            onClick={() => setActiveTab(dept.id)}
                            className={`px-4 py-2 font-medium text-sm rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                                activeTab === dept.id
                                    ? 'bg-primary text-white'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            {dept.name}
                            {badgeCount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className={
                                        activeTab === dept.id
                                            ? 'bg-white/20 text-white border-0'
                                            : 'bg-emerald-100 text-emerald-800'
                                    }
                                >
                                    {badgeCount}
                                </Badge>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Active Workstreams"
                    value={filteredLiveTasks.length}
                    subtext={workstreamSubtext}
                    icon={Activity}
                />
                <KPICard
                    title="Submissions (Period)"
                    value={filteredCompletedTasks.length}
                    subtext="Completed workflows"
                    icon={Briefcase}
                    colorClass="text-green-600"
                    bgColorClass="bg-green-100"
                />
                <KPICard
                    title="Teams Active"
                    value={new Set(filteredLiveTasks.map((t) => t.assignedTo)).size}
                    subtext="Unique operators in view"
                    icon={Users}
                    colorClass="text-purple-600"
                    bgColorClass="bg-purple-100"
                />
                <KPICard
                    title="Active Alerts"
                    value={filteredLiveTasks.filter((t) => t.locationCompliant === false).length}
                    subtext="Currently off-site or flagged"
                    icon={AlertTriangle}
                    colorClass="text-red-600"
                    bgColorClass="bg-red-100"
                />
            </div>

            {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">{overviewMainColumn}</div>
                    <div className="space-y-6">
                        <DepartmentCharts
                            activeTab={activeTab}
                            tasks={filteredCompletedTasks}
                            liveTasks={filteredLiveTasks}
                        />
                    </div>
                </div>
            ) : (
                deptConfig && (
                    <LeadershipDepartmentPanel
                        key={deptConfig.id}
                        department={deptConfig}
                        filteredLiveTasks={filteredLiveTasks}
                        filteredCompletedTasks={filteredCompletedTasks}
                        aggregationSessions={aggregationSessions}
                        assigneeNames={assigneeNames}
                    />
                )
            )}
        </div>
    );
}
