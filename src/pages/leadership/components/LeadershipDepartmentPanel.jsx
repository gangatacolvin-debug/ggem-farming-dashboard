import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Lock, MapPin, Radio, Unlock } from 'lucide-react';
import { formatAggregationHubDisplay } from '@/features/aggregation/lib/aggregationSessions';
import LiveOperationsFeed from './LiveOperationsFeed';
import WarehouseProcessingDashboard from './WarehouseProcessingDashboard';
import DataFieldLeadershipMetrics from './DataFieldLeadershipMetrics';
import AggregationLeadershipMetrics from './AggregationLeadershipMetrics';
import AggregationSessionDetailView from './AggregationSessionDetailView';

function formatTs(t) {
  if (!t) return '—';
  if (t?.toDate) return t.toDate().toLocaleString();
  try {
    return new Date(t).toLocaleString();
  } catch {
    return '—';
  }
}

function sessionStatusBadge(status) {
  if (status === 'active') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <Unlock className="w-3 h-3 mr-1" /> Live
      </Badge>
    );
  }
  if (status === 'closed') {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
        <Lock className="w-3 h-3 mr-1" /> Closed
      </Badge>
    );
  }
  return <Badge variant="outline">{status || '—'}</Badge>;
}

export default function LeadershipDepartmentPanel({
  department,
  filteredLiveTasks,
  filteredCompletedTasks,
  aggregationSessions = [],
  assigneeNames = {},
}) {
  const [aggTab, setAggTab] = useState('live-sessions');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionSubmissions, setSessionSubmissions] = useState([]);

  const completedForWarehouse = filteredCompletedTasks.filter((t) => t.status === 'completed');

  useEffect(() => {
    if (!selectedSessionId) {
      setSessionSubmissions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const q1 = query(collection(db, 'submissions'), where('session-id-ref', '==', selectedSessionId));
        const q2 = query(collection(db, 'submissions'), where('session-id', '==', selectedSessionId));
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        if (cancelled) return;
        const merged = [...snap1.docs, ...snap2.docs].map((d) => ({ id: d.id, ...d.data() }));
        setSessionSubmissions(Array.from(new Map(merged.map((s) => [s.id, s])).values()));
      } catch (e) {
        console.error('LeadershipDepartmentPanel: submissions load failed', e);
        if (!cancelled) setSessionSubmissions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  const activeSessions = aggregationSessions.filter((s) => s.status === 'active');
  const closedSessions = aggregationSessions.filter((s) => s.status === 'closed');
  const selectedSessionDoc = aggregationSessions.find((s) => s.sessionId === selectedSessionId);

  const sessionPicker = (sessions, emptyLabel) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            Select a session
          </CardTitle>
          <CardDescription>{emptyLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500">None in this list.</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSessionId(s.sessionId)}
                className={`w-full text-left border rounded-md px-3 py-3 flex items-center justify-between gap-3 transition-colors ${
                  selectedSessionId === s.sessionId ? 'bg-primary/5 border-primary ring-1 ring-primary/20' : 'hover:bg-gray-50'
                }`}
              >
                <div className="min-w-0 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {formatAggregationHubDisplay(s.hub) || s.hub || 'Hub'}
                    </div>
                    <div className="text-xs text-gray-500 font-mono truncate">{s.sessionId}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {s.status === 'closed' ? `Closed ${formatTs(s.closedAt)}` : `Opened ${formatTs(s.createdAt)}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {sessionStatusBadge(s.status)}
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {selectedSessionDoc && (
        <AggregationSessionDetailView sessionData={selectedSessionDoc} submissions={sessionSubmissions} />
      )}
    </div>
  );

  if (department.id === 'aggregation') {
    return (
      <Tabs
        value={aggTab}
        onValueChange={(v) => {
          setAggTab(v);
          setSelectedSessionId(null);
        }}
        className="w-full"
      >
        <TabsList className="w-full flex flex-wrap h-auto justify-start gap-1 sm:gap-2 bg-muted/50 p-2 rounded-lg">
          <TabsTrigger value="live-sessions" className="text-xs sm:text-sm">
            Live sessions
            <Badge variant="secondary" className="ml-1.5 text-[10px]">
              {activeSessions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="closed-sessions" className="text-xs sm:text-sm">
            Closed sessions
            <Badge variant="secondary" className="ml-1.5 text-[10px]">
              {closedSessions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="live-tasks" className="text-xs sm:text-sm">
            Live tasks
            <Badge variant="secondary" className="ml-1.5 text-[10px]">
              {filteredLiveTasks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="text-xs sm:text-sm">
            Metrics &amp; trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live-sessions" className="mt-6">
          {sessionPicker(activeSessions, 'Market-day sessions that are currently open.')}
        </TabsContent>
        <TabsContent value="closed-sessions" className="mt-6">
          {sessionPicker(closedSessions, 'Sealed sessions — same detail view as live, read-only.')}
        </TabsContent>
        <TabsContent value="live-tasks" className="mt-6">
          <LiveOperationsFeed
            tasks={filteredLiveTasks}
            title="Live tasks — Aggregation"
            showDepartmentBadge={false}
            assigneeNames={assigneeNames}
          />
        </TabsContent>
        <TabsContent value="metrics" className="mt-6">
          <AggregationLeadershipMetrics department={department} submissions={filteredCompletedTasks} />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <Tabs key={department.id} defaultValue="live-tasks" className="w-full">
      <TabsList className="w-full flex flex-wrap h-auto justify-start gap-2 bg-muted/50 p-2 rounded-lg">
        <TabsTrigger value="live-tasks" className="text-xs sm:text-sm">
          Live tasks
          <Badge variant="secondary" className="ml-1.5 text-[10px]">
            {filteredLiveTasks.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="metrics" className="text-xs sm:text-sm">
          Metrics &amp; trends
        </TabsTrigger>
      </TabsList>

      <TabsContent value="live-tasks" className="mt-6">
        <LiveOperationsFeed
          tasks={filteredLiveTasks}
          title={`Live tasks — ${department.name}`}
          showDepartmentBadge={false}
          assigneeNames={assigneeNames}
        />
      </TabsContent>

      <TabsContent value="metrics" className="mt-6">
        {department.id === 'warehouse' && (
          <WarehouseProcessingDashboard tasks={completedForWarehouse} liveTasks={filteredLiveTasks} embedded />
        )}
        {department.id === 'data-field' && (
          <DataFieldLeadershipMetrics department={department} submissions={filteredCompletedTasks} />
        )}
      </TabsContent>
    </Tabs>
  );
}
