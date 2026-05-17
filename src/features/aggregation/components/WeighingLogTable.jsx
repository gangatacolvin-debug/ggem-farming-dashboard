import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, FileSpreadsheet, Search } from 'lucide-react';
import { ExportService } from '@/features/aggregation/lib/ExportService';

export const WEIGHING_LOG_PAGE_SIZES = [25, 50, 100];

export default function WeighingLogTable({
    logs = [],
    loading = false,
    sessionData = null,
    showExport = true,
    defaultPageSize = 50,
}) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return logs;
        return logs.filter(
            (l) =>
                l.farmerName?.toLowerCase().includes(q) ||
                l.clubGroupName?.toLowerCase().includes(q) ||
                l.variety?.toLowerCase().includes(q) ||
                l.grade?.toLowerCase().includes(q)
        );
    }, [logs, search]);

    const totals = useMemo(() => {
        let weight = 0;
        let gross = 0;
        for (const l of filtered) {
            weight += Number(l.weightKg) || 0;
            gross += Number(l.grossAmount) || 0;
        }
        return { weight, gross, count: filtered.length };
    }, [filtered]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
    const effectivePage = Math.min(page, totalPages - 1);
    const start = effectivePage * pageSize;
    const visible = filtered.slice(start, start + pageSize);
    const showPager = filtered.length > pageSize;

    const handleExport = () => {
        if (!sessionData?.sessionId) return;
        ExportService.generateWeighingLogsExcel(sessionData, filtered.length ? filtered : logs);
    };

    if (loading) {
        return <Skeleton className="h-56 w-full rounded-lg" />;
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search farmer, club, variety…"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <span className="text-xs text-gray-500 whitespace-nowrap">Rows per page</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(v) => {
                            setPageSize(Number(v));
                            setPage(0);
                        }}
                    >
                        <SelectTrigger className="w-[88px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {WEIGHING_LOG_PAGE_SIZES.map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {showExport && sessionData?.sessionId && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={!logs.length}
                            onClick={handleExport}
                        >
                            <FileSpreadsheet className="w-4 h-4 text-green-600" />
                            Download Excel
                        </Button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border max-h-[min(60vh,520px)] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b sticky top-0 z-10">
                        <tr>
                            <th className="px-3 py-3 text-left font-semibold text-gray-600 w-12">#</th>
                            <th className="px-3 py-3 text-left font-semibold text-gray-600">Club</th>
                            <th className="px-3 py-3 text-left font-semibold text-gray-600">Farmer</th>
                            <th className="px-3 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Type</th>
                            <th className="px-3 py-3 text-left font-semibold text-gray-600">Variety · Grade</th>
                            <th className="px-3 py-3 text-right font-semibold text-gray-600">Weight</th>
                            <th className="px-3 py-3 text-right font-semibold text-gray-600 hidden sm:table-cell">Price/kg</th>
                            <th className="px-3 py-3 text-right font-semibold text-gray-600">MWK</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 italic">
                                    {search ? 'No matches for your search.' : 'No weighing logs for this session yet.'}
                                </td>
                            </tr>
                        ) : (
                            visible.map((log, i) => (
                                <tr key={`${start + i}-${log.farmerName}`} className="hover:bg-gray-50/80">
                                    <td className="px-3 py-2.5 text-gray-500 tabular-nums">{start + i + 1}</td>
                                    <td className="px-3 py-2.5 text-gray-600">{log.clubGroupName || '—'}</td>
                                    <td className="px-3 py-2.5 font-medium text-gray-900">{log.farmerName || '—'}</td>
                                    <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell text-xs">
                                        {log.farmerType || '—'}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <Badge variant="outline" className="font-normal">
                                            {log.variety || '—'} · {log.grade || '—'}
                                        </Badge>
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                                        {Number(log.weightKg || 0).toLocaleString()} kg
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-gray-600 hidden sm:table-cell tabular-nums">
                                        {Number(log.pricePerKg || 0).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-semibold text-blue-700 tabular-nums">
                                        {Number(log.grossAmount || 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
                <div className="space-y-0.5">
                    <p>
                        {filtered.length === 0
                            ? '0 farmers'
                            : showPager
                              ? `Showing ${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length.toLocaleString()} farmers`
                              : `${filtered.length.toLocaleString()} farmer${filtered.length !== 1 ? 's' : ''}`}
                        {search && logs.length !== filtered.length && (
                            <span className="text-gray-400"> (filtered from {logs.length.toLocaleString()})</span>
                        )}
                    </p>
                    {filtered.length > 0 && (
                        <p className="text-xs text-gray-500">
                            Session totals:{' '}
                            <span className="font-semibold text-emerald-700">{totals.weight.toLocaleString()} kg</span>
                            {' · '}
                            <span className="font-semibold text-blue-700">MWK {totals.gross.toLocaleString()}</span>
                        </p>
                    )}
                </div>

                {showPager && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={effectivePage <= 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>
                        <span className="text-xs tabular-nums px-1">
                            Page {effectivePage + 1} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={effectivePage >= totalPages - 1}
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
