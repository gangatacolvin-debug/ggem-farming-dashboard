import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, MapPin } from 'lucide-react';
import { formatAggregationHubDisplay } from '@/features/aggregation/lib/aggregationSessions';

function formatTime(ts) {
  if (!ts) return '—';
  if (ts?.toDate) return ts.toDate().toLocaleString();
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return '—';
  }
}

export default function ActiveAggregationSessions({ sessions, variant = 'card' }) {
  const active = (sessions || []).filter((s) => s.status === 'active');

  if (active.length === 0) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
        <Radio className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
        <span className="font-medium">Live aggregation hubs:</span>
        {active.map((s) => (
          <Badge key={s.id} variant="secondary" className="bg-white text-emerald-800 border-emerald-200">
            {formatAggregationHubDisplay(s.hub) || s.hub} · {s.sessionId}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <Card className="border-emerald-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
          Live aggregation sessions
        </CardTitle>
        <CardDescription>Active market-day sessions across hubs (aggregation day).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {active.map((s) => (
          <div
            key={s.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 rounded-md border bg-white"
          >
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {formatAggregationHubDisplay(s.hub) || s.hub || 'Hub'}
                </p>
                <p className="text-xs text-gray-500 font-mono truncate">Session: {s.sessionId}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 sm:text-right shrink-0">
              Opened {formatTime(s.createdAt)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
