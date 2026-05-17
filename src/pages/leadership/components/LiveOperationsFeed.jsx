import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Activity,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    MapPin,
    Radio,
} from 'lucide-react';
import { getDepartmentForChecklist } from '@/config/departments';
import { getTaskProgressPercent } from '@/features/checklists/lib/checklistConfigRegistry';
import LiveTaskDetailView from '@/features/checklists/components/LiveTaskDetailView';

const PAGE_SIZE = 10;

function assigneeLine(assigneeNames, assignedTo) {
    if (!assignedTo) return 'Unassigned';
    return assigneeNames?.[assignedTo] || assignedTo;
}

function locationLabel(task) {
    const compliant = task.locationCompliant ?? task.checklistProgress?._location?.compliant;
    if (compliant === true) return { text: 'On site', className: 'text-green-700' };
    if (compliant === false) return { text: 'Off site', className: 'text-red-600' };
    return { text: 'Unknown', className: 'text-gray-400' };
}

export default function LiveOperationsFeed({
    tasks,
    title = 'Live Operations',
    showDepartmentBadge = true,
    assigneeNames = {},
}) {
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [page, setPage] = useState(1);

    const inProgressTasks = useMemo(() => {
        return tasks
            .filter((t) => String(t.status || '').toLowerCase() === 'in-progress')
            .sort((a, b) => {
                const ta = a.lastUpdated?.toMillis?.() || a.startTime?.toMillis?.() || 0;
                const tb = b.lastUpdated?.toMillis?.() || b.startTime?.toMillis?.() || 0;
                return tb - ta;
            });
    }, [tasks]);

    const totalPages = Math.max(1, Math.ceil(inProgressTasks.length / PAGE_SIZE));

    useEffect(() => {
        setPage(1);
    }, [inProgressTasks.length]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const paginatedTasks = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return inProgressTasks.slice(start, start + PAGE_SIZE);
    }, [inProgressTasks, page]);

    const onSiteCount = useMemo(
        () =>
            inProgressTasks.filter(
                (t) => (t.locationCompliant ?? t.checklistProgress?._location?.compliant) === true
            ).length,
        [inProgressTasks]
    );

    const openTask = (taskId) => {
        setSelectedTaskId(taskId);
        setDetailOpen(true);
    };

    const selectedTask = inProgressTasks.find((t) => t.id === selectedTaskId);
    const selectedAssignee = selectedTask
        ? assigneeLine(assigneeNames, selectedTask.assignedTo)
        : undefined;

    const rangeStart = inProgressTasks.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(page * PAGE_SIZE, inProgressTasks.length);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Radio className="w-5 h-5 text-green-500" />
                        {title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        In-progress checklists only — click a row for the manager live view
                    </p>
                </div>
                <Badge variant="outline" className="w-fit bg-white shadow-sm">
                    <Activity className="w-3 h-3 mr-2 text-green-500 animate-pulse" />
                    {inProgressTasks.length} in progress · {onSiteCount} on site
                </Badge>
            </div>

            <Card>
                <CardHeader className="py-3 border-b bg-gray-50/80">
                    <CardTitle className="text-sm font-medium text-gray-700">
                        Active checklists
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {inProgressTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <CheckCircle2 className="w-10 h-10 text-gray-300 mb-2" />
                            <p className="font-medium text-gray-900">No checklists in progress</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Supervisors will appear here once they start a task.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Checklist</th>
                                            {showDepartmentBadge && (
                                                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Dept</th>
                                            )}
                                            <th className="px-4 py-3 text-left font-medium">Supervisor</th>
                                            <th className="px-4 py-3 text-left font-medium min-w-[140px]">Progress</th>
                                            <th className="px-4 py-3 text-left font-medium">Location</th>
                                            <th className="px-4 py-3 text-left font-medium">Updated</th>
                                            <th className="px-4 py-3 text-right font-medium w-24"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {paginatedTasks.map((task) => {
                                            const dept = getDepartmentForChecklist(task.checklistType);
                                            const progress = getTaskProgressPercent(task);
                                            const loc = locationLabel(task);
                                            const completedCount = (
                                                task.completedSections ||
                                                task.checklistProgress?.completedSections ||
                                                []
                                            ).length;

                                            return (
                                                <tr
                                                    key={task.id}
                                                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                                                    onClick={() => openTask(task.id)}
                                                >
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-gray-900">
                                                            {task.checklistName || task.checklistType}
                                                        </p>
                                                        <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                            In progress
                                                        </p>
                                                    </td>
                                                    {showDepartmentBadge && (
                                                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                                                            {dept?.name || '—'}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-gray-700">
                                                        {assigneeLine(assigneeNames, task.assignedTo)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Progress value={progress} className="h-1.5 flex-1 min-w-[60px]" />
                                                            <span className="text-xs font-medium text-gray-600 w-8 shrink-0">
                                                                {progress}%
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            {completedCount} section{completedCount !== 1 ? 's' : ''} done
                                                        </p>
                                                    </td>
                                                    <td className={`px-4 py-3 text-xs font-medium ${loc.className}`}>
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {loc.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                                        {task.lastUpdated?.toDate
                                                            ? task.lastUpdated.toDate().toLocaleTimeString([], {
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              })
                                                            : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-600 h-8"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openTask(task.id);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50/50">
                                    <p className="text-xs text-gray-500">
                                        Showing {rangeStart}–{rangeEnd} of {inProgressTasks.length}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </Button>
                                        <span className="text-xs text-gray-600 min-w-[80px] text-center">
                                            Page {page} of {totalPages}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent
                    className="!flex !flex-col gap-0 p-0 w-[min(96vw,80rem)] !max-w-[min(96vw,80rem)] sm:!max-w-[min(96vw,80rem)] max-h-[94vh] overflow-hidden"
                >
                    <DialogHeader className="shrink-0 px-6 sm:px-8 pt-6 pb-4 border-b bg-white text-left">
                        <DialogTitle className="text-xl sm:text-2xl font-bold">
                            Live operations detail
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 min-h-0">
                        {selectedTaskId && (
                            <LiveTaskDetailView
                                taskId={selectedTaskId}
                                assigneeName={selectedAssignee}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
