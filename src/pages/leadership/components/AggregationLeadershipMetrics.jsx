import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AggregationLeadershipMetrics({ department, submissions }) {
  const checklistIds = department?.checklists || [];
  const labels = department?.checklistLabels || {};

  const byType = useMemo(() => {
    const map = {};
    checklistIds.forEach((id) => {
      map[id] = submissions.filter((s) => s.checklistType === id);
    });
    return map;
  }, [submissions, checklistIds]);

  if (!checklistIds.length) return null;

  const defaultTab = checklistIds[0];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Aggregation — checklist activity</h2>
        <p className="text-gray-500 text-sm mt-1">Historical submissions (not the same as live hub sessions)</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-md">
          {checklistIds.map((id) => (
            <TabsTrigger key={id} value={id} className="text-xs sm:text-sm whitespace-normal text-left">
              {labels[id] || id}
              <Badge variant="secondary" className="ml-1.5 text-[10px] shrink-0">
                {byType[id]?.length ?? 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {checklistIds.map((id) => (
          <TabsContent key={id} value={id} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{labels[id] || id}</CardTitle>
                <CardDescription>{byType[id]?.length ?? 0} submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {(byType[id] || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No submissions for this checklist in the current dataset.</p>
                ) : (
                  <ul className="divide-y rounded-md border max-h-[360px] overflow-y-auto">
                    {(byType[id] || []).slice(0, 50).map((row) => (
                      <li key={row.id} className="px-3 py-2 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="font-medium text-gray-900 truncate">{row.checklistName || id}</span>
                        <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                          {row['session-id-ref'] || row['session-id'] || '—'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {row.submittedAt?.toDate?.() ? row.submittedAt.toDate().toLocaleString() : '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
