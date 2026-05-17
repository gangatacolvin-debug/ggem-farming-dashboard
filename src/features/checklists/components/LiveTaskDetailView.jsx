import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    MapPin,
    PlayCircle,
    User,
} from 'lucide-react';
import { getChecklistConfig, getTaskProgressPercent } from '@/features/checklists/lib/checklistConfigRegistry';
import { resolveChecklistField } from '@/pages/leadership/kpiService';

function formatFieldValue(value) {
    if (value === true) {
        return (
            <span className="inline-flex items-center gap-2 text-green-700 font-medium">
                <CheckCircle2 className="w-5 h-5 shrink-0" /> Yes
            </span>
        );
    }
    if (value === false) {
        return <span className="text-red-600 font-medium">No</span>;
    }
    if (value === null || value === undefined || value === '') {
        return <span className="text-gray-400 italic">Not filled yet</span>;
    }
    if (Array.isArray(value)) {
        return <span className="text-gray-700">{value.length} record(s)</span>;
    }
    if (typeof value === 'object') {
        return (
            <pre className="text-sm bg-gray-50 border p-4 rounded-lg overflow-x-auto max-h-40 leading-relaxed">
                {JSON.stringify(value, null, 2)}
            </pre>
        );
    }
    return <span className="text-gray-900 leading-relaxed break-words">{String(value)}</span>;
}

function getFieldValue(task, fieldId) {
    return resolveChecklistField(task, fieldId);
}

function locationLabel(task) {
    const loc = task.checklistProgress?._location;
    if (task.locationCompliant === true || loc?.compliant === true) {
        return { text: 'On site', variant: 'success' };
    }
    if (task.locationCompliant === false || loc?.compliant === false) {
        return { text: 'Off site', variant: 'danger' };
    }
    return { text: 'Location unknown', variant: 'muted' };
}

function MetaChip({ icon: Icon, children, variant = 'default' }) {
    const styles = {
        default: 'bg-gray-100 text-gray-800 border-gray-200',
        success: 'bg-green-50 text-green-800 border-green-200',
        danger: 'bg-red-50 text-red-800 border-red-200',
        muted: 'bg-gray-50 text-gray-600 border-gray-200',
        status: 'bg-blue-50 text-blue-800 border-blue-200',
    };
    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${styles[variant] || styles.default}`}
        >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            {children}
        </span>
    );
}

function StatCard({ label, children, className = '' }) {
    return (
        <Card className={`shadow-sm min-w-0 ${className}`}>
            <CardHeader className="pb-2 pt-5 px-5 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-5 px-5 sm:px-6 text-base sm:text-lg font-semibold text-gray-900 leading-relaxed break-words">
                {children}
            </CardContent>
        </Card>
    );
}

/**
 * Real-time task progress — same data model managers use on ManagerTaskDetail.
 */
export default function LiveTaskDetailView({ taskId, assigneeName }) {
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!taskId) return undefined;
        const unsub = onSnapshot(doc(db, 'tasks', taskId), (snap) => {
            setTask(snap.exists() ? { id: snap.id, ...snap.data() } : null);
            setLoading(false);
        });
        return () => unsub();
    }, [taskId]);

    if (loading) {
        return <p className="text-center text-gray-500 py-16 text-lg">Loading live checklist…</p>;
    }
    if (!task) {
        return <p className="text-center text-red-600 py-16 text-lg">Task not found.</p>;
    }

    const config = getChecklistConfig(task.checklistType);
    const currentSectionId = task.currentSection || task.checklistProgress?.currentSection;
    const currentSectionTitle =
        config?.sections.find((s) => s.id === currentSectionId)?.title || 'Not started';
    const completedSections =
        task.completedSections || task.checklistProgress?.completedSections || [];
    const progressPercentage = getTaskProgressPercent(task);
    const loc = locationLabel(task);
    const supervisor =
        assigneeName || task.supervisorInfo?.name || task.assignedTo || 'Unassigned';

    return (
        <div className="space-y-8 min-w-0 w-full">
            {/* Header */}
            <header className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight break-words">
                    {task.checklistName || config?.title || task.checklistType}
                </h2>
                <div className="flex flex-wrap gap-2">
                    <MetaChip icon={User}>{supervisor}</MetaChip>
                    <MetaChip icon={PlayCircle} variant="status">
                        {String(task.status || '—').replace(/-/g, ' ')}
                    </MetaChip>
                    <MetaChip icon={MapPin} variant={loc.variant}>
                        {loc.text}
                    </MetaChip>
                </div>
            </header>

            <Separator />

            {/* Snapshot stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard label="Current stage" className="md:col-span-2">
                    <div className="space-y-4">
                        <p className="text-lg sm:text-xl font-semibold text-blue-700 leading-relaxed break-words">
                            {currentSectionTitle}
                        </p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium text-gray-600">
                                <span>Overall progress</span>
                                <span>{progressPercentage}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-3" />
                        </div>
                    </div>
                </StatCard>
                <StatCard label="Last updated">
                    <span className="inline-flex items-center gap-2 font-medium">
                        <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                        {task.lastUpdated?.toDate
                            ? task.lastUpdated.toDate().toLocaleTimeString()
                            : '—'}
                    </span>
                </StatCard>
                <StatCard label="Shift">
                    <span className="capitalize">{task.shift || '—'}</span>
                </StatCard>
                <StatCard label="Scheduled date" className="md:col-span-2">
                    {task.scheduledDate?.toDate
                        ? task.scheduledDate.toDate().toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                          })
                        : '—'}
                </StatCard>
            </div>

            {/* Form sections */}
            <Card className="shadow-sm">
                <CardHeader className="py-5 px-6 border-b bg-slate-50">
                    <CardTitle className="text-xl font-semibold text-gray-900">Live form data</CardTitle>
                    <p className="text-sm text-gray-500 font-normal mt-1">
                        Updates automatically as the supervisor fills the checklist
                    </p>
                </CardHeader>
                <CardContent className="p-6">
                    {!config ? (
                        <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-xl">
                            <AlertCircle className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                            <p>
                                No configuration for: <strong>{task.checklistType}</strong>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {config.sections.map((section) => {
                                const isActive = section.id === currentSectionId;
                                const isCompleted = completedSections.includes(section.id);

                                return (
                                    <section
                                        key={section.id}
                                        className={`rounded-xl border-2 overflow-hidden ${
                                            isActive
                                                ? 'border-blue-300 bg-blue-50/40'
                                                : isCompleted
                                                  ? 'border-green-200 bg-green-50/30'
                                                  : 'border-gray-200 bg-white'
                                        }`}
                                    >
                                        <div className="px-5 py-4 border-b bg-white/80 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <h3
                                                className={`text-lg font-semibold leading-snug break-words pr-2 ${
                                                    isActive ? 'text-blue-800' : 'text-gray-900'
                                                }`}
                                            >
                                                {section.title}
                                            </h3>
                                            <div className="shrink-0">
                                                {isActive && (
                                                    <Badge className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-600">
                                                        In progress
                                                    </Badge>
                                                )}
                                                {isCompleted && !isActive && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-sm px-3 py-1 text-green-700 border-green-300 bg-green-50"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
                                                        Completed
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-4">
                                            {section.fields
                                                .filter(
                                                    (f) =>
                                                        f.type !== 'summary' &&
                                                        f.type !== 'milling-summary' &&
                                                        f.type !== 'info'
                                                )
                                                .map((field) => {
                                                    const value = getFieldValue(task, field.id);

                                                    if (field.type === 'log-table') {
                                                        const rows = Array.isArray(value) ? value : [];
                                                        return (
                                                            <div
                                                                key={field.id}
                                                                className="rounded-lg border bg-white p-5 space-y-3"
                                                            >
                                                                <p className="text-sm font-semibold text-gray-700">
                                                                    {field.label}
                                                                </p>
                                                                {rows.length > 0 ? (
                                                                    <div className="overflow-x-auto rounded-md border">
                                                                        <table className="w-full text-sm sm:text-base">
                                                                            <thead>
                                                                                <tr className="bg-gray-50 border-b">
                                                                                    {field.columns?.map((col) => (
                                                                                        <th
                                                                                            key={col.key}
                                                                                            className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap"
                                                                                        >
                                                                                            {col.label}
                                                                                        </th>
                                                                                    ))}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y">
                                                                                {rows.map((row, idx) => (
                                                                                    <tr
                                                                                        key={idx}
                                                                                        className="bg-white"
                                                                                    >
                                                                                        {field.columns?.map((col) => (
                                                                                            <td
                                                                                                key={col.key}
                                                                                                className="px-4 py-3 text-gray-900 align-top"
                                                                                            >
                                                                                                {row[col.key] ?? '—'}
                                                                                            </td>
                                                                                        ))}
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-gray-400 italic text-base">
                                                                        No entries yet
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={field.id}
                                                            className="rounded-lg border bg-white px-5 py-4 space-y-2 min-w-0"
                                                        >
                                                            <p className="text-sm sm:text-base font-medium text-gray-600 leading-snug break-words">
                                                                {field.label}
                                                            </p>
                                                            <div className="text-base sm:text-lg text-gray-900 min-w-0 break-words">
                                                                {formatFieldValue(value)}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
