import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, MapPin, Clock, Calendar, AlertCircle } from 'lucide-react';
import ChecklistEngine from '@/features/checklists/components/ChecklistEngine';
import { millingChecklistConfig } from '@/features/warehousing/config/millingChecklist';
import { briquetteChecklistConfig } from '@/features/warehousing/config/briquetteChecklist';
import { hubTransferChecklistConfig } from '@/features/warehousing/config/hubTransfer';
import { warehouseClosingChecklistConfig } from '@/features/warehousing/config/warehouseClosingChecklistConfig';
import { hubCollectionChecklistConfig } from '@/features/warehousing/config/hubCollectionChecklistConfig';
import { warehouseMaintenanceChecklistConfig } from '@/features/warehousing/config/warehouseMaintenanceChecklist';
import { warehouseInventoryChecklistConfig } from '@/features/warehousing/config/warehouseInventoryChecklist';
import { loadingDispatchChecklistConfig } from '@/features/warehousing/config/loadingProduceConfig';
import { outreachEngagementChecklistConfig } from '@/features/data-field/config/outreachEngagementChecklist';
import { salesMarketingChecklistConfig } from '@/features/data-field/config/salesMarketingChecklist';
import { fieldMonitoringQAChecklistConfig } from '@/features/data-field/config/Fieldmonitoringqachecklist';
import { dataCallCentreOversightChecklistConfig } from '@/features/data-field/config/Datacallcentreoversightchecklist';
import { preAggregationSetupConfig } from '@/features/aggregation/config/PreAggregationSetupChecklist';
import { qualityControlGradingConfig } from '@/features/aggregation/config/QualityControlGradingChecklist';
import { weighingRecordingConfig } from '@/features/aggregation/config/WeighingRecordingChecklist';
import { warehouseStockReceivingConfig } from '@/features/aggregation/config/WarehouseStockReceivingChecklist';
import { endOfDayReconciliationConfig } from '@/features/aggregation/config/EndofDayReconciliationChecklist';
import {
  createAggregationSessionFromPreAggregation,
  fetchActiveAggregationSessionAtHub,
  isValidAggregationHubSlug,
} from '@/features/aggregation/lib/aggregationSessions';
import {
  collectPreAggregationTeamUids,
  enrichPreAggregationSubmissionWithNames,
} from '@/features/aggregation/lib/preAggregationTeam';

// Config Lookup Strategy
const CHECKLIST_CONFIGS = {
  'milling': millingChecklistConfig,
  'briquette': briquetteChecklistConfig,
  'hubtransfer': hubTransferChecklistConfig,
  'warehouseclosing': warehouseClosingChecklistConfig,
  'hubcollection': hubCollectionChecklistConfig,
  'warehousemaintenance': warehouseMaintenanceChecklistConfig,
  'warehouseinventory': warehouseInventoryChecklistConfig,
  'loading': loadingDispatchChecklistConfig,
  'outreach-engagement': outreachEngagementChecklistConfig,
  'sales-marketing': salesMarketingChecklistConfig,
  'field-monitoring-qa': fieldMonitoringQAChecklistConfig,
  'data-callcentre-oversight': dataCallCentreOversightChecklistConfig,
  'pre-aggregation-setup': preAggregationSetupConfig,
  'aggregation-quality-control': qualityControlGradingConfig,
  'aggregation-weighing-recording': weighingRecordingConfig,
  'aggregation-warehouse-receiving': warehouseStockReceivingConfig,
  'aggregation-end-of-day': endOfDayReconciliationConfig,
};

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        if (taskDoc.exists()) {
          setTask({ id: taskDoc.id, ...taskDoc.data() });
        } else {
          setError('Task not found');
        }
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleStartTask = async () => {
    try {
      // Check if task already has progress (resuming)
      const hasProgress = task.checklistProgress && task.checklistProgress.currentStep > 1;

      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'in-progress',
        startTime: task.startTime || new Date(), // Keep original start time if resuming
        lastResumed: hasProgress ? new Date() : null
      });

      setTask(prev => ({
        ...prev,
        status: 'in-progress',
        startTime: task.startTime || new Date()
      }));
    } catch (err) {
      console.error('Error starting task:', err);
      setError('Failed to start task');
    }
  };

  const handleChecklistComplete = async (submissionData) => {
    try {
      if (submissionData.checklistType === 'pre-aggregation-setup') {
        const hub = submissionData.hub;
        const sessionId = submissionData['session-id'];
        if (!isValidAggregationHubSlug(hub)) {
          setError('Invalid hub selection.');
          return;
        }
        if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
          setError('Session ID is missing. Reload the task and try again.');
          return;
        }
        const clash = await fetchActiveAggregationSessionAtHub(hub);
        if (clash) {
          setError(
            `An active aggregation session already exists at this hub (session ${clash.sessionId}).`
          );
          return;
        }

        const teamUidFields = [
          'hub-coordinator-uid',
          'security-lead-uid',
          'data-team-representative-uid',
          'warehouse-supervisor-uid',
        ];
        for (const key of teamUidFields) {
          if (!submissionData[key] || typeof submissionData[key] !== 'string') {
            setError('Assign all hub staff from the Firestore dropdowns before submitting.');
            return;
          }
        }
      }

      let dataToSubmit = submissionData;
      if (submissionData.checklistType === 'pre-aggregation-setup') {
        dataToSubmit = await enrichPreAggregationSubmissionWithNames(db, submissionData);
      }

      const submissionWithStatus = {
        ...dataToSubmit,
        taskId: taskId,
        status: 'pending',
        supervisorId: currentUser.uid,
        submittedAt: new Date()
      };

      const submissionRef = await addDoc(collection(db, 'submissions'), submissionWithStatus);

      if (submissionWithStatus.checklistType === 'pre-aggregation-setup') {
        try {
          await createAggregationSessionFromPreAggregation({
            sessionId: submissionWithStatus['session-id'],
            hub: submissionWithStatus.hub,
            openedByUid: currentUser.uid,
            assignedTeam: collectPreAggregationTeamUids(submissionWithStatus),
            preAggregationSubmissionId: submissionRef.id,
            preAggregationTaskId: taskId,
          });
        } catch (sessionErr) {
          console.error('Aggregation session create failed:', sessionErr);
          await deleteDoc(doc(db, 'submissions', submissionRef.id));
          setError(
            sessionErr?.message ||
              'Could not create aggregation session. Submission was not saved. Try again.'
          );
          return;
        }
      }

      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'pending',
        endTime: new Date(),
        submissionId: submissionRef.id
      });

      toast.success('Checklist Submitted! ✓', {
        description: 'Waiting for Manager Approval.',
        duration: 3000,
      });
      setTimeout(() => navigate('/dashboard/supervisor'), 1500);
    } catch (err) {
      console.error('Error submitting checklist:', err);
      setError('Failed to submit checklist');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading task...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard/supervisor')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Resolve config based on task type
  const activeConfig = task.checklistType ? CHECKLIST_CONFIGS[task.checklistType] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/dashboard/supervisor')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <Badge className={
          task.status === 'completed' ? 'bg-green-500' :
            task.status === 'in-progress' ? 'bg-blue-500' :
              'bg-gray-500'
        }>
          {task.status}
        </Badge>
      </div>

      {/* Task Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{task.checklistName || 'Task Details'}</CardTitle>
          <CardDescription>
            {task.checklistType && `Type: ${task.checklistType}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Scheduled Date</p>
                <p className="text-sm">
                  {task.scheduledDate?.toDate
                    ? new Date(task.scheduledDate.toDate()).toLocaleDateString()
                    : 'Not set'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Shift</p>
                <p className="text-sm capitalize">{task.shift || 'Not set'}</p>
              </div>
            </div>

            {task.location && (
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm">Tracking Enabled</p>
                </div>
              </div>
            )}
          </div>

          {task.status === 'pending' && (
            <div className="pt-4">
              <Button
                onClick={handleStartTask}
                className="w-full bg-primary"
                size="lg"
              >
                Start Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Forms - Show when task is in progress */}
      {task.status === 'in-progress' && (
        <>
          {/* ADD RESUME ALERT HERE - Before checklist */}
          {task.checklistProgress && task.checklistProgress.currentStep > 1 && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                <strong>📋 Resuming from Step {task.checklistProgress.currentStep}</strong><br />
                Your progress has been saved. Continue from where you left off.
              </AlertDescription>
            </Alert>
          )}

          {activeConfig ? (
            <ChecklistEngine
              config={activeConfig}
              initialData={task.checklistProgress || {}}
              onSubmit={handleChecklistComplete}
              taskId={task.id}
              expectedLocation={task.location}
              taskData={task}
            />
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configuration for checklist type "{task.checklistType}" not found.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Completed Status */}
      {task.status === 'completed' && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Task completed successfully on {task.endTime?.toDate
              ? new Date(task.endTime.toDate()).toLocaleString()
              : 'Unknown'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}