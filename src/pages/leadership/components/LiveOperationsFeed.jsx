import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDepartmentForChecklist } from '@/config/departments';

function assigneeLine(assigneeNames, assignedTo) {
  if (!assignedTo) return 'Unassigned';
  const name = assigneeNames?.[assignedTo];
  return name || assignedTo;
}

export default function LiveOperationsFeed({
  tasks,
  title = 'Live Operations Feed',
  showDepartmentBadge = true,
  assigneeNames = {},
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No active operations in this view.</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const dept = getDepartmentForChecklist(task.checklistType);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {task.checklistName || task.checklistType}
                      </span>
                      {showDepartmentBadge && dept && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {dept.name}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1 flex-wrap">
                      <span>
                        By: {assigneeLine(assigneeNames, task.assignedTo)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{task.status}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0 ml-2">
                    {task.checklistProgress?.completedSections && (
                      <div className="text-sm font-medium text-blue-600">
                        {task.checklistProgress.completedSections.length} Steps Done
                      </div>
                    )}
                    <span className="text-xs text-gray-400">
                      {task.lastUpdated?.toDate
                        ? task.lastUpdated.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
