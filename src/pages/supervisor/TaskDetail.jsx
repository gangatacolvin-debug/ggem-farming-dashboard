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
import { ArrowLeft, MapPin, Clock, Calendar, AlertCircle, CheckCircle2, XCircle, FileText, Timer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
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

/** Read-only view of a submitted checklist (shared with leadership milling tab). */
export function SubmissionReadOnlyView({ task, submission }) {
  const statusColors = {
    pending: 'bg-orange-50 border-orange-200 text-orange-800',
    approved: 'bg-green-50 border-green-200 text-green-800',
    rejected: 'bg-red-50 border-red-200 text-red-800',
    flagged: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };
  const statusColor = statusColors[submission.status] || statusColors.pending;
  const config = CHECKLIST_CONFIGS[task.checklistType];

  const formatValue = (val) => {
    if (val === true) return <CheckCircle2 className="w-4 h-4 text-green-600 inline" />;
    if (val === false) return <XCircle className="w-4 h-4 text-red-500 inline" />;
    if (val === null || val === undefined || val === '') return <span className="text-gray-400 italic">—</span>;
    if (typeof val === 'object' && val.toDate) return new Date(val.toDate()).toLocaleString();
    if (Array.isArray(val)) return <span className="text-gray-600">{val.length} record(s)</span>;
    if (typeof val === 'object') return <span className="text-gray-500 text-xs font-mono">[complex]</span>;
    return String(val);
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Alert className={statusColor}>
        <AlertDescription className="font-medium">
          {submission.status === 'pending' && '⏳ Submitted — Waiting for manager approval'}
          {submission.status === 'approved' && '✅ Approved by your manager'}
          {submission.status === 'rejected' && '❌ Rejected — See feedback below'}
          {submission.status === 'flagged' && '🚩 Flagged for follow-up — See feedback below'}
        </AlertDescription>
      </Alert>

      {/* Manager Feedback */}
      {submission.feedback && (
        <Card className="border-l-4 border-l-orange-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Manager Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{submission.feedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Submission Meta */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Submission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <Label className="text-xs text-gray-500 uppercase">Submitted</Label>
            <p className="font-medium mt-0.5">
              {submission.submittedAt?.toDate
                ? new Date(submission.submittedAt.toDate()).toLocaleString()
                : '—'}
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-500 uppercase">Checklist</Label>
            <p className="font-medium mt-0.5 capitalize">{task.checklistName || task.checklistType}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500 uppercase">Location</Label>
            <p className="font-medium mt-0.5">
              {submission._location?.compliant === true
                ? '✅ Verified'
                : submission._location?.compliant === false
                ? '⚠️ Outside zone'
                : '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Time Summary */}
      {submission.sectionTimes && Object.keys(submission.sectionTimes).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Time on Task
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-sm space-y-1">
            {Object.entries(submission.sectionTimes).map(([sectionId, seconds]) => (
              <div key={sectionId} className="flex justify-between text-gray-600">
                <span className="capitalize">{sectionId.replace(/-/g, ' ')}:</span>
                <span>{Math.floor(seconds / 60)}m {seconds % 60}s</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total:</span>
              <span>
                {submission.totalTimeSeconds
                  ? `${Math.floor(submission.totalTimeSeconds / 60)}m ${submission.totalTimeSeconds % 60}s`
                  : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field-by-Field Read-Only — driven by checklist config */}
      {config ? (
        <div className="space-y-4">
          {config.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-2 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {section.icon} {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {section.fields
                  .filter((f) => f.type !== 'summary')
                  .map((field) => (
                    <div key={field.id} className="py-2.5 flex justify-between items-center text-sm gap-4">
                      <span className="text-gray-600 flex-1">{field.label}</span>
                      <span className="font-medium text-right">{formatValue(submission[field.id])}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Fallback: list all top-level fields from submission */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission Data</CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {Object.entries(submission)
              .filter(([key]) => !['taskId', 'supervisorId', 'status', 'submittedAt', 'id', 'sectionTimes', 'totalTimeSeconds', 'checklistStartedAt', 'completedAt', '_location', 'feedback'].includes(key))
              .map(([key, val]) => (
                <div key={key} className="py-2 flex justify-between gap-4">
                  <span className="text-gray-500 capitalize">{key.replace(/-/g, ' ')}</span>
                  <span className="font-medium text-right">{formatValue(val)}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        if (taskDoc.exists()) {
          const taskData = { id: taskDoc.id, ...taskDoc.data() };
          setTask(taskData);

          if (taskData.submissionId) {
            try {
              const subDoc = await getDoc(doc(db, 'submissions', taskData.submissionId));
              if (subDoc.exists()) {
                setSubmission({ id: subDoc.id, ...subDoc.data() });
              }
            } catch (subErr) {
              console.error('Error fetching submission:', subErr);
            }
          }
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
      const hasProgress = task.checklistProgress && task.checklistProgress.currentStep > 1;
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'in-progress',
        startTime: task.startTime || new Date(),
        lastResumed: hasProgress ? new Date() : null
      });
      setTask(prev => ({ ...prev, status: 'in-progress', startTime: task.startTime || new Date() }));
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
        if (!isValidAggregationHubSlug(hub)) { setError('Invalid hub selection.'); return; }
        if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) { setError('Session ID is missing. Reload the task and try again.'); return; }
        const clash = await fetchActiveAggregationSessionAtHub(hub);
        if (clash) { setError(`An active aggregation session already exists at this hub (session ${clash.sessionId}).`); return; }
        const teamUidFields = ['hub-coordinator-uid', 'security-lead-uid', 'data-team-representative-uid', 'warehouse-supervisor-uid'];
        for (const key of teamUidFields) {
          if (!submissionData[key] || typeof submissionData[key] !== 'string') { setError('Assign all hub staff from the Firestore dropdowns before submitting.'); return; }
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
          setError(sessionErr?.message || 'Could not create aggregation session. Submission was not saved. Try again.');
          return;
        }
      }

      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'pending',
        endTime: new Date(),
        submissionId: submissionRef.id
      });

      toast.success('Checklist Submitted! ✓', { description: 'Waiting for Manager Approval.', duration: 3000 });
      setTimeout(() => navigate('/dashboard/supervisor'), 1500);
    } catch (err) {
      console.error('Error submitting checklist:', err);
      setError('Failed to submit checklist');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Loading task...</p></div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard/supervisor')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      </div>
    );
  }

  const activeConfig = task.checklistType ? CHECKLIST_CONFIGS[task.checklistType] : null;
  const statusBadgeClass =
    task.status === 'approved' ? 'bg-green-500' :
    task.status === 'rejected' ? 'bg-red-500' :
    task.status === 'pending' ? 'bg-orange-500' :
    task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-500';

  const isSubmitted = Boolean(task.submissionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/dashboard/supervisor')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <Badge className={statusBadgeClass}>
          {task.status === 'pending' ? 'Awaiting Review' : task.status}
        </Badge>
      </div>

      {/* Task Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{task.checklistName || 'Task Details'}</CardTitle>
          <CardDescription>{task.checklistType && `Type: ${task.checklistType}`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Scheduled Date</p>
                <p className="text-sm">{task.scheduledDate?.toDate ? new Date(task.scheduledDate.toDate()).toLocaleDateString() : 'Not set'}</p>
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

          {/* Start Task button — for unstarted assigned tasks, or legacy 'pending' docs with no submission */}
          {(!task.status || task.status === 'assigned' || (task.status === 'pending' && !isSubmitted)) && !isSubmitted && (
            <div className="pt-4">
              <Button onClick={handleStartTask} className="w-full bg-primary" size="lg">Start Task</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SUBMITTED: show read-only view ── */}
      {isSubmitted && submission && (
        <SubmissionReadOnlyView task={task} submission={submission} />
      )}

      {/* ── IN PROGRESS: show live checklist ── */}
      {task.status === 'in-progress' && !isSubmitted && (
        <>
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
              <AlertDescription>Configuration for checklist type "{task.checklistType}" not found.</AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* ── COMPLETED (legacy) ── */}
      {task.status === 'completed' && !isSubmitted && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Task completed on {task.endTime?.toDate ? new Date(task.endTime.toDate()).toLocaleString() : 'Unknown'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}