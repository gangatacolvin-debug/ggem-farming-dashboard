import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { ExportService } from '@/features/aggregation/lib/ExportService';

function StatusCard({ title, sub, icon: IconComponent }) {
  const isDone = !!sub;
  return (
    <Card className={`border-none shadow-sm ${isDone ? 'bg-green-50' : 'bg-gray-50'}`}>
      <CardContent className="p-4 flex flex-col items-center gap-2">
        <IconComponent className={`w-5 h-5 ${isDone ? 'text-green-600' : 'text-gray-300'}`} />
        <p className={`text-[10px] font-bold uppercase tracking-wider ${isDone ? 'text-green-800' : 'text-gray-400'}`}>{title}</p>
        <Badge variant={isDone ? 'default' : 'outline'} className={`text-[9px] ${isDone ? 'bg-green-600 hover:bg-green-600' : 'text-gray-400'}`}>
          {isDone ? 'Submitted' : 'Pending'}
        </Badge>
      </CardContent>
    </Card>
  );
}

function TeamRow({ role, name, present }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-500 uppercase font-semibold">{role}</span>
        <span className="text-sm font-medium">{name || '---'}</span>
      </div>
      {present ? (
        <Badge className="bg-green-100 text-green-700 border-none group-hover:px-4 transition-all">Present</Badge>
      ) : (
        <Badge variant="outline" className="text-gray-300 border-gray-100">Absent</Badge>
      )}
    </div>
  );
}

function DiscrepancyRow({ label, val1, val2, unit, tolerance = 0 }) {
  const diff = Math.abs(val1 - val2);
  const isError = diff > tolerance;
  return (
    <div className={`flex items-center justify-between p-3 rounded-md border ${isError ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end">
          <div className="flex gap-2 text-xs">
            <span className="text-gray-500">{val1}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{val2}</span>
          </div>
          {isError ? (
            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Discrepancy: {diff} {unit}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Matched
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Session audit layout (manager hub parity, leadership: no seal — export only). */
export default function AggregationSessionDetailView({ sessionData, submissions }) {
  if (!sessionData) return null;

  const getSub = (type) => submissions.find((s) => s.checklistType === type);
  const setup = getSub('pre-aggregation-setup');
  const qc = getSub('aggregation-quality-control');
  const weighing = getSub('aggregation-weighing-recording');
  const warehouse = getSub('aggregation-warehouse-receiving');
  const eod = getSub('aggregation-end-of-day');

  return (
    <div className="space-y-6 border rounded-lg p-4 bg-gray-50/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Session detail</h3>
          <p className="text-sm text-gray-500 font-mono">{sessionData.sessionId}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Export</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => ExportService.generateSessionPDF(sessionData, submissions)}>
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => ExportService.generateSessionExcel(sessionData, submissions)}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatusCard title="Setup" sub={setup} icon={LayoutDashboard} />
        <StatusCard title="Quality Control" sub={qc} icon={ClipboardCheck} />
        <StatusCard title="Weighing" sub={weighing} icon={Scale} />
        <StatusCard title="Warehouse" sub={warehouse} icon={Warehouse} />
        <StatusCard title="Reconciliation" sub={eod} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="bg-gray-50/50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Master Performance Audit</CardTitle>
                  <CardDescription>Comparison of logs across stations</CardDescription>
                </div>
                {sessionData.status === 'active' ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <Unlock className="w-3 h-3 mr-1" /> Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                    <Lock className="w-3 h-3 mr-1" /> Sealed
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Farmers</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">{weighing?.['total-farmers-weighed'] || 0}</span>
                    <span className="text-gray-400 text-sm mb-1">/ {setup?.['expected-farmers'] || '--'} expected</span>
                  </div>
                  <Progress value={(weighing?.['total-farmers-weighed'] / setup?.['expected-farmers']) * 100 || 0} className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total weight</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-green-600">{(weighing?.['total-weight-kg'] || 0).toLocaleString()} kg</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Warehouse: {warehouse?.['total-weight-received-kg'] || 0} kg</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total value</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-blue-600">MWK {(weighing?.['total-gross-amount'] || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Avg MWK/kg:{' '}
                    {weighing?.['total-weight-kg'] ? (weighing['total-gross-amount'] / weighing['total-weight-kg']).toFixed(1) : 0}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Data reconciliation
              </h4>

              <div className="space-y-3">
                <DiscrepancyRow label="Bags logged vs received" val1={weighing?.['total-bags-weighed'] || 0} val2={warehouse?.['total-bags-received'] || 0} unit="Bags" />
                <DiscrepancyRow label="Weight logged vs received" val1={weighing?.['total-weight-kg'] || 0} val2={warehouse?.['total-weight-received-kg'] || 0} unit="kg" tolerance={5} />
                <DiscrepancyRow label="Farmers weighed vs reconciled" val1={weighing?.['total-farmers-weighed'] || 0} val2={eod?.['farmers-attended-today'] || 0} unit="People" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Weighing log</CardTitle>
              <CardDescription>Rows from the weighing checklist for this session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Farmer</th>
                      <th className="px-3 py-2 text-left font-semibold">Club</th>
                      <th className="px-3 py-2 text-left font-semibold">Quality</th>
                      <th className="px-3 py-2 text-right font-semibold">Weight</th>
                      <th className="px-3 py-2 text-right font-semibold">Value (MWK)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {weighing?.['farmer-weighing-logs']?.map((log, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-medium">{log.farmerName}</td>
                        <td className="px-3 py-2 text-gray-500">{log.clubGroupName}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-[10px]">
                            {log.variety} - {log.grade}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{log.weightKg} kg</td>
                        <td className="px-3 py-2 text-right font-bold text-blue-600">{Number(log.grossAmount).toLocaleString()}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-gray-400 italic">
                          No weighing logs for this session yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">On-site team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TeamRow role="Coordinator" name={setup?.['hub-coordinator-name']} present={setup?.['hub-coordinator-present']} />
              <TeamRow role="Security Lead" name={setup?.['security-lead-name']} present={setup?.['security-team-present']} />
              <TeamRow role="Warehouse Lead" name={setup?.['warehouse-supervisor-name']} present={setup?.['warehouse-team-present']} />
              <TeamRow role="Data Lead" name={setup?.['data-team-representative-name']} present={setup?.['data-team-present']} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Quality summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center bg-red-50 p-3 rounded border border-red-100">
                <span className="text-sm font-medium text-red-800">Rejected</span>
                <span className="text-xl font-bold text-red-800">{qc?.['batches-rejected-count'] || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-orange-50 p-3 rounded border border-orange-100">
                <span className="text-sm font-medium text-orange-800">Downgraded</span>
                <span className="text-xl font-bold text-orange-800">{qc?.['batches-downgraded-count'] || 0}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase">Exceptions</p>
                <p className="text-sm italic text-gray-700">&quot;{qc?.['quality-exceptions-details'] || 'None reported.'}&quot;</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
