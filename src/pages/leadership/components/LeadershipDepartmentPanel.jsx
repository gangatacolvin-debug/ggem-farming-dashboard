import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getDepartmentForChecklist } from '@/config/departments';
import { indexSubmissionsBySessionId } from '@/features/aggregation/lib/sessionMetrics';
import AggregationSessionsPanel from '@/features/aggregation/components/AggregationSessionsPanel';
import LiveOperationsFeed from './LiveOperationsFeed';
import WarehouseProcessingDashboard from './WarehouseProcessingDashboard';
import DataFieldLeadershipMetrics from './DataFieldLeadershipMetrics';
import AggregationLeadershipMetrics from './AggregationLeadershipMetrics';

export default function LeadershipDepartmentPanel({
  department,
  filteredLiveTasks,
  filteredCompletedTasks,
  aggregationSessions = [],
  assigneeNames = {},
}) {
  const warehouseSubmissions = filteredCompletedTasks.filter((t) => {
    const dept = getDepartmentForChecklist(t.checklistType);
    return dept?.id === 'warehouse';
  });

  const aggregationSubmissionIndex = useMemo(
    () => indexSubmissionsBySessionId(filteredCompletedTasks),
    [filteredCompletedTasks]
  );

  if (department.id === 'aggregation') {
    return (
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto justify-start gap-1 sm:gap-2 bg-muted/50 p-2 rounded-lg">
          <TabsTrigger value="sessions" className="text-xs sm:text-sm">
            Sessions
            <Badge variant="secondary" className="ml-1.5 text-[10px]">
              {aggregationSessions.length}
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

        <TabsContent value="sessions" className="mt-6">
          <AggregationSessionsPanel
            sessions={aggregationSessions}
            submissionIndex={aggregationSubmissionIndex}
            days={90}
          />
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
          <WarehouseProcessingDashboard tasks={warehouseSubmissions} liveTasks={filteredLiveTasks} embedded />
        )}
        {department.id === 'data-field' && (
          <DataFieldLeadershipMetrics department={department} submissions={filteredCompletedTasks} />
        )}
      </TabsContent>
    </Tabs>
  );
}
