import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ExportService } from '@/features/aggregation/lib/ExportService';
import AggregationSessionsPanel from '@/features/aggregation/components/AggregationSessionsPanel';
import WeighingLogTable from '@/features/aggregation/components/WeighingLogTable';
import {
  LayoutDashboard,
  Users,
  Scale,
  Warehouse,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Lock,
  Unlock,
  Download,
  FileText,
  FileSpreadsheet,
  Activity,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Wifi,
  Circle,
  ListOrdered,
  UserCheck,
  PackageCheck,
  ClipboardList,
  ShieldCheck,
  SunMedium,
} from 'lucide-react';

// â”€â”€â”€ Skeleton Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HubSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-48 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      {/* Live indicator skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Status cards skeleton */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="min-w-[130px] h-24 rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Live Indicator Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LiveBanner({ sessionData, lastUpdated }) {
  const isActive = sessionData?.status === 'active';

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${isActive
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}
    >
      <div className="flex items-center gap-2.5">
        {isActive ? (
          <>
            {/* Pulsing live dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="font-semibold">Live Session</span>
            <span className="text-green-600 opacity-70">Â·</span>
            <span className="text-green-700 opacity-80">
              Hub: {sessionData?.hub?.replaceAll('-', ' ') || 'â€”'}
            </span>
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5" />
            <span className="font-medium">Archived Session</span>
            <span className="opacity-50">Â· Read-only</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs opacity-60">
        <RefreshCw className="w-3 h-3" />
        <span>Updated {lastUpdated}</span>
      </div>
    </div>
  );
}

// â”€â”€â”€ Status Cards (Checklist Pipeline) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CHECKLIST_STEPS = [
  { key: 'pre-aggregation-setup', label: 'Setup', icon: LayoutDashboard },
  { key: 'aggregation-quality-control', label: 'Quality QC', icon: ClipboardCheck },
  { key: 'aggregation-weighing-recording', label: 'Weighing', icon: Scale },
  { key: 'aggregation-warehouse-receiving', label: 'Warehouse', icon: Warehouse },
  { key: 'aggregation-end-of-day', label: 'End of Day', icon: CheckCircle2 },
];

function PipelineStep({ label, icon: Icon, submitted, submittedAt, isLast }) {
  return (
    <div className="flex items-center gap-0">
      <div
        className={`flex flex-col items-center min-w-[120px] px-3 py-3 rounded-xl border transition-all ${submitted
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50 border-gray-100'
          }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${submitted ? 'bg-green-100' : 'bg-gray-100'
            }`}
        >
          <Icon className={`w-4 h-4 ${submitted ? 'text-green-600' : 'text-gray-300'}`} />
        </div>
        <p
          className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${submitted ? 'text-green-800' : 'text-gray-400'
            }`}
        >
          {label}
        </p>
        {submitted && submittedAt ? (
          <p className="text-[9px] text-green-600 mt-0.5 opacity-70">{submittedAt}</p>
        ) : (
          <Badge
            variant="outline"
            className={`text-[9px] mt-1 px-1.5 py-0 h-4 ${submitted ? 'border-green-300 text-green-700' : 'text-gray-300'
              }`}
          >
            {submitted ? 'Done' : 'Pending'}
          </Badge>
        )}
      </div>
      {!isLast && (
        <div className="flex items-center mx-1">
          <ArrowRight className={`w-4 h-4 ${submitted ? 'text-green-400' : 'text-gray-200'}`} />
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ KPI Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function KPICard({ label, value, sub, color = 'default', icon: Icon }) {
  const colors = {
    default: 'bg-gray-50 border-gray-100',
    green: 'bg-green-50 border-green-100',
    blue: 'bg-blue-50 border-blue-100',
    orange: 'bg-orange-50 border-orange-100',
    red: 'bg-red-50 border-red-100',
  };
  const textColors = {
    default: 'text-gray-900',
    green: 'text-green-700',
    blue: 'text-blue-700',
    orange: 'text-orange-700',
    red: 'text-red-700',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        {Icon && <Icon className={`w-4 h-4 opacity-50 ${textColors[color]}`} />}
      </div>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// â”€â”€â”€ Discrepancy Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DiscrepancyRow({ label, val1, val2, unit, tolerance = 0 }) {
  const diff = Math.abs((val1 || 0) - (val2 || 0));
  const isError = diff > tolerance;
  const sign = (val1 || 0) > (val2 || 0) ? '+' : '-';

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-lg border ${isError ? 'bg-red-50 border-red-100' : 'bg-green-50/40 border-green-100'
        }`}
    >
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-800">{(val1 || 0).toLocaleString()}</span>
          <span className="text-gray-300 text-xs">logged</span>
          <span className="text-gray-200">|</span>
          <span className="font-semibold text-gray-800">{(val2 || 0).toLocaleString()}</span>
          <span className="text-gray-300 text-xs">received</span>
        </div>
        {isError ? (
          <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-bold px-2">
            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
            {sign}{diff} {unit}
          </Badge>
        ) : (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold px-2">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
            Matched
          </Badge>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Team Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TeamRow({ role, name, present }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{role}</p>
        <p className="text-sm font-medium text-gray-800">{name || 'â€”'}</p>
      </div>
      {present ? (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-green-700">Present</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <span className="text-xs text-gray-400">Absent</span>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Session List Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SessionListItem({ session, isSelected, onClick, formatTs }) {
  const isActive = session.status === 'active';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-3 border transition-all flex items-center justify-between gap-3 ${isSelected
          ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
        }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}
        />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {session.hub?.replaceAll('-', ' ') || 'Hub'}
          </p>
          <p className="text-[11px] text-gray-400">
            {session.sessionId} Â· {isActive ? `Opened ${formatTs(session.createdAt)}` : `Sealed ${formatTs(session.closedAt)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge
          className={`text-[10px] px-2 py-0 h-5 ${isActive
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
        >
          {isActive ? 'Active' : 'Sealed'}
        </Badge>
        <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
      </div>
    </button>
  );
}

// â”€â”€â”€ Session Timeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TIMELINE_STEPS = [
  {
    key: 'pre-aggregation-setup',
    label: 'Session Opened',
    description: (sub, sessionData) =>
      sub
        ? `Setup submitted by ${sub['hub-coordinator-name'] || 'coordinator'}. ${sub['expected-farmers'] || 0} farmers expected. Team confirmed on-site.`
        : null,
    icon: SunMedium,
    color: 'blue',
    tsField: 'submittedAt',
  },
  {
    key: 'aggregation-quality-control',
    label: 'Quality Control Completed',
    description: (sub) =>
      sub
        ? `${sub['batches-rejected-count'] || 0} batches rejected, ${sub['batches-downgraded-count'] || 0} downgraded. ${sub['quality-exceptions-details'] ? `Note: "${sub['quality-exceptions-details']}"` : 'No exceptions reported.'}`
        : null,
    icon: ShieldCheck,
    color: 'purple',
    tsField: 'submittedAt',
  },
  {
    key: 'aggregation-weighing-recording',
    label: 'Weighing & Recording Done',
    description: (sub) =>
      sub
        ? `${sub['total-farmers-weighed'] || 0} farmers weighed. Total: ${(sub['total-weight-kg'] || 0).toLocaleString()} kg worth MWK ${(sub['total-gross-amount'] || 0).toLocaleString()}.`
        : null,
    icon: Scale,
    color: 'green',
    tsField: 'submittedAt',
  },
  {
    key: 'aggregation-warehouse-receiving',
    label: 'Warehouse Receiving Confirmed',
    description: (sub) =>
      sub
        ? `Warehouse received ${sub['total-bags-received'] || 0} bags (${(sub['total-weight-received-kg'] || 0).toLocaleString()} kg).`
        : null,
    icon: PackageCheck,
    color: 'orange',
    tsField: 'submittedAt',
  },
  {
    key: 'aggregation-end-of-day',
    label: 'End-of-Day Reconciliation',
    description: (sub) =>
      sub
        ? `${sub['farmers-attended-today'] || 0} farmers reconciled. Session closed out.`
        : null,
    icon: ClipboardList,
    color: 'teal',
    tsField: 'submittedAt',
  },
];

const STEP_COLORS = {
  blue: { dot: 'bg-blue-500', ring: 'ring-blue-100', icon: 'text-blue-600', card: 'border-blue-100   bg-blue-50/40', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  purple: { dot: 'bg-purple-500', ring: 'ring-purple-100', icon: 'text-purple-600', card: 'border-purple-100 bg-purple-50/40', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  green: { dot: 'bg-green-500', ring: 'ring-green-100', icon: 'text-green-600', card: 'border-green-100  bg-green-50/40', badge: 'bg-green-100 text-green-700 border-green-200' },
  orange: { dot: 'bg-orange-500', ring: 'ring-orange-100', icon: 'text-orange-600', card: 'border-orange-100 bg-orange-50/40', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  teal: { dot: 'bg-teal-500', ring: 'ring-teal-100', icon: 'text-teal-600', card: 'border-teal-100   bg-teal-50/40', badge: 'bg-teal-100 text-teal-700 border-teal-200' },
};

function SessionTimeline({ submissions, sessionData, submissionsLoading, formatTs }) {
  const getSub = (type) => submissions.find((s) => s.checklistType === type);

  const getTimestamp = (sub, field) => {
    if (!sub) return null;
    return sub[field] || sub.createdAt || null;
  };

  const openedAt = sessionData?.createdAt;
  const sealedAt = sessionData?.closedAt;

  // Build enriched events list
  const events = TIMELINE_STEPS.map((step) => {
    const sub = getSub(step.key);
    return {
      ...step,
      sub,
      submitted: !!sub,
      ts: getTimestamp(sub, step.tsField),
      descriptionText: step.description(sub, sessionData),
    };
  });

  // Duration calculation
  const firstTs = events.find((e) => e.submitted)?.ts;
  const lastTs = events.filter((e) => e.submitted).slice(-1)[0]?.ts;
  const getDuration = (start, end) => {
    try {
      const s = start?.toDate ? start.toDate() : new Date(start);
      const e = end?.toDate ? end.toDate() : new Date(end);
      const diffMs = e - s;
      if (isNaN(diffMs) || diffMs < 0) return null;
      const h = Math.floor(diffMs / 3_600_000);
      const m = Math.floor((diffMs % 3_600_000) / 60_000);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    } catch { return null; }
  };

  const totalDuration = firstTs && lastTs ? getDuration(firstTs, lastTs) : null;
  const submittedCount = events.filter((e) => e.submitted).length;

  if (submissionsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Skeleton className="w-8 h-8 rounded-full" />
              {i < 4 && <Skeleton className="w-0.5 h-16 mt-1" />}
            </div>
            <div className="flex-1 pb-6 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{submittedCount} / 5 events logged</span>
        </div>
        {openedAt && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-3.5 h-3.5 text-gray-300" />
            <span>Started {formatTs(openedAt)}</span>
          </div>
        )}
        {totalDuration && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity className="w-3.5 h-3.5 text-gray-300" />
            <span>Operations spanned <span className="font-semibold text-gray-700">{totalDuration}</span></span>
          </div>
        )}
        {sealedAt && (
          <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[11px] ml-auto">
            <Lock className="w-2.5 h-2.5 mr-1" /> Sealed {formatTs(sealedAt)}
          </Badge>
        )}
      </div>

      {/* Timeline items */}
      <div className="relative">
        {events.map((event, i) => {
          const colors = STEP_COLORS[event.color];
          const isLast = i === events.length - 1;
          const Icon = event.icon;

          return (
            <div key={event.key} className="flex gap-4">

              {/* Dot + line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ring-4 z-10 flex-shrink-0 ${event.submitted
                      ? `${colors.dot} ${colors.ring}`
                      : 'bg-gray-100 ring-gray-50'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${event.submitted ? 'text-white' : 'text-gray-300'}`} />
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 my-1 min-h-[2rem] ${event.submitted ? 'bg-gray-200' : 'bg-gray-100 border-dashed'
                      }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 ${!isLast ? 'pb-5' : 'pb-1'}`}>
                <div className="flex items-center gap-2 mb-1.5 min-h-[36px]">
                  <p
                    className={`text-sm font-semibold ${event.submitted ? 'text-gray-900' : 'text-gray-400'
                      }`}
                  >
                    {event.label}
                  </p>
                  {event.submitted ? (
                    <Badge className={`text-[10px] px-2 h-5 font-medium ${colors.badge}`}>
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-2 h-5 text-gray-400 border-gray-200">
                      Pending
                    </Badge>
                  )}
                  {event.ts && (
                    <span className="text-[11px] text-gray-400 ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTs(event.ts)}
                    </span>
                  )}
                </div>

                {event.submitted && event.descriptionText && (
                  <div className={`rounded-lg border px-4 py-3 text-sm text-gray-600 leading-relaxed ${colors.card}`}>
                    {event.descriptionText}

                    {/* Extra detail rows per step */}
                    {event.key === 'aggregation-weighing-recording' && event.sub?.['farmer-weighing-logs']?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200/60 grid grid-cols-3 gap-2">
                        {[
                          { label: 'Bags', value: event.sub['total-bags-weighed'] || 0 },
                          { label: 'Farmers', value: event.sub['total-farmers-weighed'] || 0 },
                          { label: 'Avg/kg', value: `MWK ${event.sub['total-weight-kg'] ? ((event.sub['total-gross-amount'] || 0) / event.sub['total-weight-kg']).toFixed(0) : 0}` },
                        ].map((stat) => (
                          <div key={stat.label} className="text-center">
                            <p className="text-xs font-bold text-gray-800">{stat.value}</p>
                            <p className="text-[10px] text-gray-400">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {event.key === 'pre-aggregation-setup' && event.sub && (
                      <div className="mt-2 pt-2 border-t border-gray-200/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                        {event.sub['hub-coordinator-present'] && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-blue-400" /> Coordinator present</span>}
                        {event.sub['security-team-present'] && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-blue-400" /> Security present</span>}
                        {event.sub['warehouse-team-present'] && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-blue-400" /> Warehouse present</span>}
                        {event.sub['data-team-present'] && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-blue-400" /> Data team present</span>}
                      </div>
                    )}
                  </div>
                )}

                {!event.submitted && (
                  <div className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 italic">
                    Not yet submitted
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Sealed event at bottom */}
        {sealedAt && (
          <div className="flex gap-4 mt-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center ring-4 bg-gray-700 ring-gray-100 z-10">
                <Lock className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 mb-1.5 min-h-[36px]">
                <p className="text-sm font-semibold text-gray-900">Session Sealed & Archived</p>
                <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-[10px] px-2 h-5">
                  <Lock className="w-2.5 h-2.5 mr-1" /> Final
                </Badge>
                <span className="text-[11px] text-gray-400 ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTs(sealedAt)}
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                All records locked. Session is read-only.{' '}
                {totalDuration && (
                  <span>Total operation time: <strong>{totalDuration}</strong>.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AggregationSessionHub() {
  const { userDepartment } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [lastUpdated, setLastUpdated] = useState('just now');

  // â”€â”€ 1. Sessions â€” real-time listener â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (userDepartment !== 'aggregation') return;

    const q = query(
      collection(db, 'aggregationSessions'),
      where('department', '==', 'aggregation')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));

      setSessions(list);
      if (list.length > 0 && !selectedSessionId) {
        setSelectedSessionId(list[0].sessionId);
      }
      setLoading(false);
      setLastUpdated('just now');
    });

    return () => unsubscribe();
  }, [userDepartment]);

  // â”€â”€ 2. Submissions â€” real-time listener for selected session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!selectedSessionId) return;

    const current = sessions.find((s) => s.sessionId === selectedSessionId);
    setSessionData(current || null);
    setSubmissionsLoading(true);

    // Listen to both field names (until migration is done)
    const q1 = query(collection(db, 'submissions'), where('session-id-ref', '==', selectedSessionId));
    const q2 = query(collection(db, 'submissions'), where('session-id', '==', selectedSessionId));

    let snap1Docs = [];
    let snap2Docs = [];

    const merge = () => {
      const all = [
        ...snap1Docs.map((d) => ({ id: d.id, ...d.data() })),
        ...snap2Docs.map((d) => ({ id: d.id, ...d.data() })),
      ];
      const unique = Array.from(new Map(all.map((s) => [s.id, s])).values());
      setSubmissions(unique);
      setSubmissionsLoading(false);
      setLastUpdated('just now');
    };

    const unsub1 = onSnapshot(q1, (snap) => { snap1Docs = snap.docs; merge(); });
    const unsub2 = onSnapshot(q2, (snap) => { snap2Docs = snap.docs; merge(); });

    return () => { unsub1(); unsub2(); };
  }, [selectedSessionId, sessions]);

  // â”€â”€ 3. "Last updated" ticker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated((prev) => {
        if (prev === 'just now') return '1 min ago';
        const match = prev.match(/(\d+) min ago/);
        if (match) return `${parseInt(match[1]) + 1} min ago`;
        return prev;
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const formatTs = (t) => {
    if (!t) return 'â€”';
    try {
      const d = t?.toDate ? t.toDate() : new Date(t);
      return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return 'â€”'; }
  };

  const formatShortTime = (t) => {
    if (!t) return null;
    try {
      const d = t?.toDate ? t.toDate() : new Date(t);
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch { return null; }
  };

  const getSub = (type) => submissions.find((s) => s.checklistType === type);

  // â”€â”€ Seal handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSealSession = async (sessionArg) => {
    const target = sessionArg || sessionData;
    if (!target?.id) return;
    toast.warning('Seal This Session?', {
      description: 'All records will become read-only. This cannot be undone.',
      action: {
        label: 'Seal Session',
        onClick: async () => {
          setActionLoading(true);
          try {
            await updateDoc(doc(db, 'aggregationSessions', target.id), {
              status: 'closed',
              closedAt: serverTimestamp(),
              closedBy: 'Manager',
            });
            toast.success('Session Sealed âœ“', { description: 'All records are now read-only.', duration: 5000 });
          } catch (err) {
            console.error(err);
            toast.error('Seal Failed', { description: 'Could not seal session. Please try again.' });
          } finally {
            setActionLoading(false);
          }
        },
      },
      duration: 8000,
    });
  };

  // â”€â”€ Derived data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const setup = getSub('pre-aggregation-setup');
  const qc = getSub('aggregation-quality-control');
  const weighing = getSub('aggregation-weighing-recording');
  const warehouse = getSub('aggregation-warehouse-receiving');
  const eod = getSub('aggregation-end-of-day');

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const sealedSessions = sessions.filter((s) => s.status === 'closed');
  const submittedCount = [setup, qc, weighing, warehouse, eod].filter(Boolean).length;
  const progressPct = (submittedCount / 5) * 100;

  const totalWeight = weighing?.['total-weight-kg'] || 0;
  const totalValue = weighing?.['total-gross-amount'] || 0;
  const totalFarmers = weighing?.['total-farmers-weighed'] || 0;
  const expectedFarmers = setup?.['expected-farmers'] || 0;
  const avgRate = totalWeight > 0 ? (totalValue / totalWeight).toFixed(1) : '0';
  const warehouseWeight = warehouse?.['total-weight-received-kg'] || 0;

  if (loading) return <HubSkeleton />;

  return (
    <div className="space-y-5 pb-12">

      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Aggregation Session Hub
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            Unified monitoring and control for market day operations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Session picker */}
          <select
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[220px]"
            value={selectedSessionId || ''}
            onChange={(e) => { setSelectedSessionId(e.target.value); setActiveTab('details'); }}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.sessionId}>
                {s.hub?.replaceAll('-', ' ')} Â· {s.sessionId} ({s.status})
              </option>
            ))}
          </select>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shadow-sm">
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => ExportService.generateSessionPDF(sessionData, submissions)}
              >
                <FileText className="w-4 h-4 text-red-500" /> PDF Report
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => ExportService.generateSessionExcel(sessionData, submissions)}
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel Spreadsheet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Seal button (shortcut) */}
          {sessionData?.status === 'active' && (
            <Button
              size="sm"
              variant="destructive"
              className="gap-2 shadow-sm"
              onClick={handleSealSession}
              disabled={actionLoading}
            >
              <Lock className="w-3.5 h-3.5" />
              {actionLoading ? 'Sealingâ€¦' : 'Seal Session'}
            </Button>
          )}
        </div>
      </div>

      <AggregationSessionsPanel
        sessions={sessions}
        days={90}
        allowSeal
        onSeal={handleSealSession}
      />

      {/* â”€â”€ Live Banner â”€â”€ */}
      {sessionData && <LiveBanner sessionData={sessionData} lastUpdated={lastUpdated} />}

      {/* â”€â”€ Tabs â”€â”€ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full lg:w-[360px]">
          <TabsTrigger value="details" className="gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Session Detail
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <ListOrdered className="w-3.5 h-3.5" /> Timeline
          </TabsTrigger>
        </TabsList>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TIMELINE TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <TabsContent value="timeline" className="mt-5">
          {!sessionData ? (
            <Alert>
              <AlertDescription>
                No session selected. Pick a session to view its timeline.
              </AlertDescription>
            </Alert>
          ) : (
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Session Event Timeline</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      A chronological record of everything that happened during this market day
                    </CardDescription>
                  </div>
                  <Badge
                    className={`text-[10px] px-2 ${sessionData.status === 'active'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                  >
                    {sessionData.hub?.replaceAll('-', ' ')} Â· {sessionData.sessionId}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <SessionTimeline
                  submissions={submissions}
                  sessionData={sessionData}
                  submissionsLoading={submissionsLoading}
                  formatTs={formatTs}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• DETAILS TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <TabsContent value="details" className="mt-5">
          {!sessionData ? (
            <Alert>
              <AlertDescription>
                No session selected. Start a session from the Supervisor dashboard (Pre-Aggregation Setup).
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-5">

              {/* â”€â”€ Checklist Pipeline â”€â”€ */}
              <Card className="shadow-sm border-gray-100 overflow-hidden">
                <CardHeader className="pb-3 bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Checklist Pipeline</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {submittedCount} of 5 checklists submitted
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progressPct} className="w-24 h-1.5" />
                      <span className="text-xs font-semibold text-gray-500">{Math.round(progressPct)}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  {submissionsLoading ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="min-w-[120px] h-24 rounded-xl flex-shrink-0" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-0 overflow-x-auto pb-1">
                      {CHECKLIST_STEPS.map((step, i) => {
                        const sub = getSub(step.key);
                        return (
                          <PipelineStep
                            key={step.key}
                            label={step.label}
                            icon={step.icon}
                            submitted={!!sub}
                            submittedAt={formatShortTime(sub?.submittedAt || sub?.createdAt)}
                            isLast={i === CHECKLIST_STEPS.length - 1}
                          />
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* â”€â”€ KPI Row â”€â”€ */}
              {submissionsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KPICard
                    label="Farmers Weighed"
                    value={totalFarmers}
                    sub={expectedFarmers ? `of ${expectedFarmers} expected` : 'No target set'}
                    color={expectedFarmers && totalFarmers >= expectedFarmers ? 'green' : 'default'}
                    icon={Users}
                  />
                  <KPICard
                    label="Total Tonnage"
                    value={`${(totalWeight / 1000).toFixed(2)} t`}
                    sub={`${totalWeight.toLocaleString()} kg total`}
                    color="green"
                    icon={Scale}
                  />
                  <KPICard
                    label="Total Value"
                    value={`MWK ${(totalValue / 1_000_000).toFixed(2)}M`}
                    sub={`Avg MWK ${avgRate}/kg`}
                    color="blue"
                    icon={TrendingUp}
                  />
                  <KPICard
                    label="QC Rejections"
                    value={qc?.['batches-rejected-count'] || 0}
                    sub={`${qc?.['batches-downgraded-count'] || 0} downgraded`}
                    color={(qc?.['batches-rejected-count'] || 0) > 0 ? 'red' : 'default'}
                    icon={AlertTriangle}
                  />
                </div>
              )}

              {/* â”€â”€ Main 2-col layout â”€â”€ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left: Audit + Weighing Table */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Data Reconciliation */}
                  <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-semibold">Data Reconciliation Audit</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            Cross-check between weighing station and warehouse
                          </CardDescription>
                        </div>
                        <Badge
                          className={`text-[10px] px-2 ${sessionData.status === 'active'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                        >
                          {sessionData.status === 'active' ? (
                            <><Unlock className="w-2.5 h-2.5 mr-1" /> Active</>
                          ) : (
                            <><Lock className="w-2.5 h-2.5 mr-1" /> Sealed</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2.5">
                      {submissionsLoading ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                        </div>
                      ) : (
                        <>
                          <DiscrepancyRow
                            label="Bags â€” Logged vs Received"
                            val1={weighing?.['total-bags-weighed'] || 0}
                            val2={warehouse?.['total-bags-received'] || 0}
                            unit="bags"
                          />
                          <DiscrepancyRow
                            label="Weight â€” Logged vs Received"
                            val1={totalWeight}
                            val2={warehouseWeight}
                            unit="kg"
                            tolerance={5}
                          />
                          <DiscrepancyRow
                            label="Farmers â€” Weighed vs Reconciled"
                            val1={totalFarmers}
                            val2={eod?.['farmers-attended-today'] || 0}
                            unit="farmers"
                          />
                        </>
                      )}

                      {/* Warehouse weight summary line */}
                      {!submissionsLoading && warehouseWeight > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                          <span>Warehouse confirmed receipt:</span>
                          <span className="font-semibold text-gray-800">{warehouseWeight.toLocaleString()} kg</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Weighing Log */}
                  <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-semibold">Farmer Weighing Log</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {weighing?.['farmer-weighing-logs']?.length || 0} transactions recorded
                          </CardDescription>
                        </div>
                        <MapPin className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {submissionsLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-full rounded-lg" />
                          <Skeleton className="h-48 w-full rounded-lg" />
                        </div>
                      ) : (
                        <WeighingLogTable
                          logs={weighing?.['farmer-weighing-logs'] || weighing?.farmerWeighingLogs || []}
                          sessionData={sessionData}
                          showExport
                          defaultPageSize={50}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Team + QC + Seal */}
                <div className="space-y-5">

                  {/* On-Site Team */}
                  <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-3 border-b border-gray-100">
                      <CardTitle className="text-sm font-semibold">On-Site Team</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      {submissionsLoading ? (
                        <div className="space-y-3">
                          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
                        </div>
                      ) : (
                        <>
                          <TeamRow role="Hub Coordinator" name={setup?.['hub-coordinator-name']} present={setup?.['hub-coordinator-present']} />
                          <TeamRow role="Security Lead" name={setup?.['security-lead-name']} present={setup?.['security-team-present']} />
                          <TeamRow role="Warehouse Lead" name={setup?.['warehouse-supervisor-name']} present={setup?.['warehouse-team-present']} />
                          <TeamRow role="Data Lead" name={setup?.['data-team-representative-name']} present={setup?.['data-team-present']} />
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quality Summary */}
                  <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-3 border-b border-gray-100">
                      <CardTitle className="text-sm font-semibold">Quality Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-2.5">
                      {submissionsLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-14 rounded-lg" />
                          <Skeleton className="h-14 rounded-lg" />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                            <div>
                              <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">Rejected</p>
                              <p className="text-xl font-bold text-red-800 leading-none mt-0.5">
                                {qc?.['batches-rejected-count'] || 0}
                                <span className="text-xs font-normal ml-1 text-red-500">batches</span>
                              </p>
                            </div>
                            <AlertTriangle className="w-6 h-6 text-red-300" />
                          </div>
                          <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-3 py-2.5">
                            <div>
                              <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Downgraded</p>
                              <p className="text-xl font-bold text-orange-800 leading-none mt-0.5">
                                {qc?.['batches-downgraded-count'] || 0}
                                <span className="text-xs font-normal ml-1 text-orange-500">batches</span>
                              </p>
                            </div>
                            <AlertTriangle className="w-6 h-6 text-orange-300" />
                          </div>
                          {qc?.['quality-exceptions-details'] && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Exception Notes</p>
                              <p className="text-xs text-gray-600 italic leading-relaxed">
                                "{qc['quality-exceptions-details']}"
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Session Info */}
                  <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-3 border-b border-gray-100">
                      <CardTitle className="text-sm font-semibold">Session Info</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Session ID</span>
                        <span className="font-mono font-medium text-gray-700">{sessionData.sessionId}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Hub</span>
                        <span className="font-medium text-gray-700 capitalize">{sessionData.hub?.replaceAll('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Opened</span>
                        <span className="font-medium text-gray-700">{formatTs(sessionData.createdAt)}</span>
                      </div>
                      {sessionData.closedAt && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Sealed</span>
                          <span className="font-medium text-gray-700">{formatTs(sessionData.closedAt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Status</span>
                        <Badge className={`text-[10px] px-2 h-5 ${sessionData.status === 'active'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                          {sessionData.status === 'active' ? 'Active' : 'Sealed'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Seal Action */}
                  {sessionData.status === 'active' && (
                    <Card className="shadow-sm border-2 border-primary/20 bg-primary/5">
                      <CardContent className="pt-5 pb-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">Finalize & Seal</p>
                            <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                              Lock all records and archive this market day. Cannot be undone.
                            </p>
                          </div>
                        </div>
                        <Button
                          className="w-full font-semibold h-10 gap-2"
                          onClick={handleSealSession}
                          disabled={actionLoading}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          {actionLoading ? 'Sealingâ€¦' : 'Seal & Archive Session'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
