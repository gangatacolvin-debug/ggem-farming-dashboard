import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, Activity, AlertTriangle, Briefcase } from 'lucide-react';
import { useResolveUserNames } from './hooks/useResolveUserNames';
import { DEPARTMENTS_CONFIG, getDepartmentForChecklist } from '@/config/departments';
import { normalizeDepartment } from '@/lib/departmentNormalize';
import DepartmentCharts from './components/DepartmentCharts';
import LiveOperationsFeed from './components/LiveOperationsFeed';
import ActiveAggregationSessions from './components/ActiveAggregationSessions';
import LeadershipDepartmentPanel from './components/LeadershipDepartmentPanel';

const KPICard = ({ title, value, subtext, icon, colorClass = 'text-blue-600', bgColorClass = 'bg-blue-100', borderColor = 'border-l-blue-500' }) => (
    <Card className={`border-l-4 ${borderColor} shadow-sm`}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold mt-1">{value}</h3>
                    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
                    <div className="mt-3 h-1 w-16 bg-gradient-to-r from-gray-200 to-transparent rounded-full opacity-40"></div>
                </div>
                <div className={`p-3 rounded-full ${bgColorClass}`}>
                    {icon && React.createElement(icon, { className: `w-6 h-6 ${colorClass}` })}
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
    const [flags, setFlags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataErrors, setDataErrors] = useState({});

    useEffect(() => {
        const qLive = query(
            collection(db, 'tasks'),
            where('status', 'in', ['assigned', 'pending', 'in-progress'])
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

        const qFlags = query(
            collection(db, 'flags'),
            where('status', 'in', ['open', 'acknowledged', 'action-taken', 'escalated'])
        );
        const unsubFlags = onSnapshot(
            qFlags,
            (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFlags(list);
                setDataErrors(prev => {
                    const next = { ...prev };
                    delete next.flags;
                    return next;
                });
            },
            (err) => {
                console.error('Leadership flags:', err);
                setDataErrors(prev => ({
                    ...prev,
                    flags: 'Flags feed failed to load.'
                }));
            }
        );

        return () => {
            unsubLive();
            unsubCompleted();
            unsubAgg();
            unsubFlags();
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
            <div className="space-y-6 p-8 animate-pulse">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="h-8 w-64 bg-gray-200 rounded"></div>
                        <div className="h-4 w-96 bg-gray-100 rounded mt-2"></div>
                    </div>
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-2 border-b">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-10 w-32 bg-gray-200 rounded-full"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="border-l-4 border-l-gray-200">
                            <CardContent className="p-6">
                                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 w-32 bg-gray-100 rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <div className="h-64 bg-gray-100 rounded"></div>
                    </div>
                </div>
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

    const filteredFlags =
        activeTab === 'overview'
            ? flags
            : flags.filter((f) => normalizeDepartment(f.department) === activeTab);

    const workstreamSubtext =
        activeTab === 'aggregation' && activeAggSessions.length > 0
            ? `${filteredLiveTasks.length} tasks · ${activeAggSessions.length} live hub session(s)`
            : 'Tasks currently in progress';

    const deptConfig = DEPARTMENTS_CONFIG.find((d) => d.id === activeTab);

    const overviewMainColumn = (
        <div className="space-y-6">
            {filteredFlags.length > 0 && (
                <Card className="border-l-4 border-l-red-500 border-red-200 shadow-lg">
                    <CardHeader className="pb-3 border-b bg-red-50/50 flex flex-row items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-red-700">Active Operational Flags ({filteredFlags.length})</h3>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y max-h-[300px] overflow-y-auto">
                            {filteredFlags.sort((a, b) => (b.triggeredAt?.toMillis?.() || 0) - (a.triggeredAt?.toMillis?.() || 0)).map(flag => (
                                <div key={flag.id} className="p-4 hover:bg-gray-50 flex items-start gap-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-gray-900">{flag.fieldLabel}</h4>
                                            <Badge variant={['open', 'escalated'].includes(flag.status) ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                                                {flag.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600">{flag.message}</p>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                                            <span className="capitalize bg-gray-100 px-2 py-0.5 rounded text-gray-700">{flag.department}</span>
                                            <span>•</span>
                                            <span className="font-medium">{flag.supervisorName}</span>
                                            <span>•</span>
                                            <span>{flag.triggeredAt ? new Date(flag.triggeredAt.toDate()).toLocaleString() : 'Just now'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
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
                <Alert variant="destructive" className="border-l-4 border-l-red-600 shadow-sm">
                    <AlertTriangle className="h-4 w-4" />
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
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">Leadership Overview</h1>
                        {liveTasks.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-emerald-700">Live</span>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1">Real-time metrics across all GGEM operations</p>
                </div>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2.5 font-medium text-sm rounded-full transition-all whitespace-nowrap inline-flex items-center gap-2 ${activeTab === 'overview'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                >
                    Enterprise Overview
                    {overviewLivePulse > 0 && (
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'overview'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                        >
                            {overviewLivePulse}
                        </span>
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
                            className={`px-4 py-2.5 font-medium text-sm rounded-full flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === dept.id
                                    ? 'bg-gray-900 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            {dept.name}
                            {badgeCount > 0 && (
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === dept.id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    {badgeCount}
                                </span>
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
                    borderColor="border-l-blue-500"
                />
                <KPICard
                    title="Submissions (Period)"
                    value={filteredCompletedTasks.length}
                    subtext="Completed workflows"
                    icon={Briefcase}
                    colorClass="text-green-600"
                    bgColorClass="bg-green-100"
                    borderColor="border-l-green-500"
                />
                <KPICard
                    title="Teams Active"
                    value={new Set(filteredLiveTasks.map((t) => t.assignedTo)).size}
                    subtext="Unique operators in view"
                    icon={Users}
                    colorClass="text-purple-600"
                    bgColorClass="bg-purple-100"
                    borderColor="border-l-purple-500"
                />
                <KPICard
                    title="Active Alerts"
                    value={filteredFlags.length}
                    subtext="Unresolved flags across operations"
                    icon={AlertTriangle}
                    colorClass="text-red-600"
                    bgColorClass="bg-red-100"
                    borderColor="border-l-red-500"
                />
            </div>

            {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">{overviewMainColumn}</div>
                    <div className="space-y-6">
                        <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
                            <CardContent className="p-6">
                                <DepartmentCharts
                                    activeTab={activeTab}
                                    tasks={filteredCompletedTasks}
                                    liveTasks={filteredLiveTasks}
                                />
                            </CardContent>
                        </Card>
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
