import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    LayoutDashboard,
    Scale,
    Warehouse,
    ClipboardCheck,
    CheckCircle2,
    AlertTriangle,
    Lock,
    Unlock,
    Download,
    FileText,
    FileSpreadsheet,
} from 'lucide-react';
import WeighingLogTable from './WeighingLogTable';
import { ExportService } from '@/features/aggregation/lib/ExportService';
import { formatAggregationHubDisplay } from '@/features/aggregation/lib/aggregationSessions';
import { buildSessionMetrics } from '@/features/aggregation/lib/sessionMetrics';
import { resolveChecklistField } from '@/pages/leadership/kpiService';

function StatusCard({ title, done, icon: Icon }) {
    return (
        <Card className={`border shadow-sm min-w-0 ${done ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <Icon className={`w-5 h-5 ${done ? 'text-green-600' : 'text-gray-300'}`} />
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
                <Badge variant={done ? 'default' : 'outline'} className={done ? 'bg-green-600' : ''}>
                    {done ? 'Submitted' : 'Pending'}
                </Badge>
            </CardContent>
        </Card>
    );
}

function DiscrepancyRow({ label, val1, val2, unit, tolerance = 0 }) {
    const diff = Math.abs(Number(val1) - Number(val2));
    const ok = diff <= tolerance;
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-lg border ${ok ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
            <span className="text-sm font-medium text-gray-800">{label}</span>
            <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-600">{val1} vs {val2} {unit}</span>
                {ok ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Matched</Badge>
                ) : (
                    <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" /> Î” {diff} {unit}
                    </Badge>
                )}
            </div>
        </div>
    );
}


function BreakdownTable({ title, rows, totalWeight }) {
    if (!rows.length) {
        return <p className="text-sm text-gray-500 italic py-2">No breakdown data yet.</p>;
    }
    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-600">{title}</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-gray-600">Farmers</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-gray-600">Weight (kg)</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-gray-600">MWK</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-gray-600">% of session</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {rows.map((r) => (
                        <tr key={r.key}>
                            <td className="px-4 py-2.5 font-medium">{r.key}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">{r.count}</td>
                            <td className="px-4 py-2.5 text-right font-medium">{r.weightKg.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right text-blue-700">{r.valueMwk.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right text-gray-500">
                                {totalWeight > 0 ? ((r.weightKg / totalWeight) * 100).toFixed(1) : 'â€”'}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function teamField(setup, key) {
    return setup ? resolveChecklistField(setup, key) : undefined;
}

export default function AggregationSessionDetailView({ sessionData, submissions, loading = false }) {
    const m = useMemo(() => buildSessionMetrics(submissions), [submissions]);

    if (!sessionData) return null;

    const hubLabel = formatAggregationHubDisplay(sessionData.hub) || sessionData.hub || 'Hub';
    const isLive = sessionData.status === 'active';

    return (
        <div className="space-y-6 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{hubLabel}</h2>
                    <p className="text-sm text-gray-500 font-mono mt-1 break-all">{sessionData.sessionId}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {isLive ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                <Unlock className="w-3 h-3 mr-1" /> Live session
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                <Lock className="w-3 h-3 mr-1" /> Closed
                            </Badge>
                        )}
                        <Badge variant="outline">{Math.round(m.progressPct)}% checklists</Badge>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 shrink-0">
                            <Download className="w-4 h-4" /> Export
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Session export</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => ExportService.generateSessionPDF(sessionData, submissions)}>
                            <FileText className="w-4 h-4 mr-2 text-red-500" /> PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => ExportService.generateSessionExcel(sessionData, submissions)}>
                            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel (full session)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => ExportService.generateWeighingLogsExcel(sessionData, m.logs)}
                            disabled={!m.logs.length}
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" /> Excel (weighing log only)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatusCard title="Setup" done={!!m.setup} icon={LayoutDashboard} />
                <StatusCard title="QC" done={!!m.qc} icon={ClipboardCheck} />
                <StatusCard title="Weighing" done={!!m.weighing} icon={Scale} />
                <StatusCard title="Warehouse" done={!!m.warehouse} icon={Warehouse} />
                <StatusCard title="EOD" done={!!m.eod} icon={CheckCircle2} />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Farmers weighed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{m.totalFarmers}</p>
                            <p className="text-xs text-gray-500 mt-1">Expected: {m.expectedFarmers || 'â€”'}</p>
                            {m.expectedFarmers > 0 && (
                                <Progress value={(m.totalFarmers / m.expectedFarmers) * 100} className="h-2 mt-2" />
                            )}
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-t-4 border-t-emerald-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Rice purchased (kg)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-emerald-700">{m.totalWeight.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">Warehouse received: {m.warehouseKg.toLocaleString()} kg</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-t-4 border-t-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Total value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-blue-700">MWK {m.totalValue.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Avg {m.totalWeight > 0 ? (m.totalValue / m.totalWeight).toFixed(1) : 'â€”'} MWK/kg
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Rice by variety & grade</CardTitle>
                    <CardDescription>Roll-up from farmer weighing logs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? (
                        <Skeleton className="h-32 w-full" />
                    ) : (
                        <>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">By variety</p>
                                <BreakdownTable title="Variety" rows={m.byVariety} totalWeight={m.totalWeight} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">By grade</p>
                                <BreakdownTable title="Grade" rows={m.byGrade} totalWeight={m.totalWeight} />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Reconciliation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading ? (
                        <Skeleton className="h-24 w-full" />
                    ) : (
                        <>
                            <DiscrepancyRow label="Bags weighed vs received" val1={m.totalBagsWeighed} val2={m.totalBagsReceived} unit="bags" />
                            <DiscrepancyRow label="Weight weighed vs warehouse" val1={m.totalWeight} val2={m.warehouseKg} unit="kg" tolerance={5} />
                            <DiscrepancyRow label="Farmers weighed vs EOD" val1={m.totalFarmers} val2={m.farmersReconciled} unit="farmers" />
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Farmer weighing log</CardTitle>
                    <CardDescription>{m.logs.length} transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <WeighingLogTable
                        logs={m.logs}
                        loading={loading}
                        sessionData={sessionData}
                        showExport
                        defaultPageSize={50}
                    />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">On-site team</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {loading ? (
                            <Skeleton className="h-24 w-full" />
                        ) : (
                            <>
                                <p>
                                    <span className="text-gray-500">Coordinator:</span>{' '}
                                    {teamField(m.setup, 'hub-coordinator-name') || 'â€”'}
                                </p>
                                <p>
                                    <span className="text-gray-500">Warehouse lead:</span>{' '}
                                    {teamField(m.setup, 'warehouse-supervisor-name') || 'â€”'}
                                </p>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-red-700 font-medium">QC rejected</span>
                                    <span className="font-bold">{m.qcRejected}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-orange-700 font-medium">QC downgraded</span>
                                    <span className="font-bold">{m.qcDowngraded}</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
