import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Lock, MapPin, Unlock } from 'lucide-react';
import { formatAggregationHubDisplay } from '@/features/aggregation/lib/aggregationSessions';
import {
    buildSessionMetrics,
    filterSessionsForRegister,
    indexSubmissionsBySessionId,
    sessionTimestampMs,
} from '@/features/aggregation/lib/sessionMetrics';
import useSessionSubmissions from '@/features/aggregation/hooks/useSessionSubmissions';
import AggregationSessionDetailView from './AggregationSessionDetailView';

const PAGE_SIZE = 10;
const DEFAULT_DAYS = 90;

function formatTs(t) {
    if (!t) return '—';
    if (t?.toDate) return t.toDate().toLocaleString();
    try {
        return new Date(t).toLocaleString();
    } catch {
        return '—';
    }
}

function StatusBadge({ status }) {
    if (status === 'active') {
        return (
            <Badge className="bg-green-100 text-green-800 border-green-200">
                <Unlock className="w-3 h-3 mr-1" /> Live
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            <Lock className="w-3 h-3 mr-1" /> Closed
        </Badge>
    );
}

function SessionDetailDialog({ open, onOpenChange, session, allowSeal, onSeal }) {
    const sessionId = session?.sessionId;
    const { submissions, loading } = useSessionSubmissions(open ? sessionId : null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!flex !flex-col gap-0 p-0 w-[min(96vw,80rem)] !max-w-[min(96vw,80rem)] sm:!max-w-[min(96vw,80rem)] max-h-[94vh] overflow-hidden">
                <DialogHeader className="shrink-0 px-6 sm:px-8 pt-6 pb-4 border-b text-left">
                    <DialogTitle className="text-xl sm:text-2xl font-bold pr-8">
                        Aggregation session
                    </DialogTitle>
                    <p className="text-sm text-gray-500 font-normal mt-1">
                        {formatAggregationHubDisplay(session?.hub) || session?.hub} · {session?.sessionId}
                    </p>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 min-h-0">
                    {session && (
                        <AggregationSessionDetailView
                            sessionData={session}
                            submissions={submissions}
                            loading={loading}
                        />
                    )}
                </div>
                {allowSeal && session?.status === 'active' && onSeal && (
                    <div className="shrink-0 px-6 sm:px-8 py-4 border-t bg-gray-50 flex justify-end">
                        <Button variant="destructive" onClick={() => onSeal(session)}>
                            Seal session
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * Shared session register + detail dialog (leadership & manager).
 */
export default function AggregationSessionsPanel({
    sessions = [],
    submissionIndex = null,
    days = DEFAULT_DAYS,
    allowSeal = false,
    onSeal,
}) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const indexed = useMemo(
        () => submissionIndex || indexSubmissionsBySessionId([]),
        [submissionIndex]
    );

    const filtered = useMemo(() => {
        const list = filterSessionsForRegister(sessions, { statusFilter, days });
        return [...list].sort((a, b) => sessionTimestampMs(b) - sessionTimestampMs(a));
    }, [sessions, statusFilter, days]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const openSession = (session) => {
        setSelectedSession(session);
        setDialogOpen(true);
    };

    const liveCount = sessions.filter((s) => s.status === 'active').length;
    const closedInWindow = filterSessionsForRegister(sessions, { statusFilter: 'closed', days }).length;

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Market-day sessions</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Live sessions always shown. Closed sessions from the last {days} days. Click a row for the full report.
                </p>
            </div>

            <Tabs
                value={statusFilter}
                onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                }}
            >
                <TabsList className="flex flex-wrap h-auto gap-1">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="live">
                        Live
                        <Badge variant="secondary" className="ml-1.5 text-[10px]">
                            {liveCount}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="closed">
                        Closed ({days}d)
                        <Badge variant="secondary" className="ml-1.5 text-[10px]">
                            {closedInWindow}
                        </Badge>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Session register</CardTitle>
                    <CardDescription>{filtered.length} session(s) in this view</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-y">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Hub</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Rice (kg)</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">MWK</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Progress</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {pageRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400 italic">
                                            No sessions match this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    pageRows.map((s) => {
                                        const subs = indexed[s.sessionId] || [];
                                        const preview = buildSessionMetrics(subs);
                                        const dateLabel =
                                            s.status === 'closed'
                                                ? `Closed ${formatTs(s.closedAt)}`
                                                : `Opened ${formatTs(s.createdAt)}`;

                                        return (
                                            <tr
                                                key={s.id || s.sessionId}
                                                className="hover:bg-gray-50/80 cursor-pointer"
                                                onClick={() => openSession(s)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900 truncate">
                                                                {formatAggregationHubDisplay(s.hub) || s.hub}
                                                            </p>
                                                            <p className="text-xs text-gray-400 font-mono truncate">
                                                                {s.sessionId}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={s.status} />
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{dateLabel}</td>
                                                <td className="px-4 py-3 text-right font-medium text-emerald-700">
                                                    {preview.totalWeight > 0
                                                        ? preview.totalWeight.toLocaleString()
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-blue-700">
                                                    {preview.totalValue > 0
                                                        ? preview.totalValue.toLocaleString()
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {preview.submittedCount}/5
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openSession(s);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4" /> View
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
                            <span>
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <SessionDetailDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                session={selectedSession}
                allowSeal={allowSeal}
                onSeal={onSeal}
            />
        </div>
    );
}
