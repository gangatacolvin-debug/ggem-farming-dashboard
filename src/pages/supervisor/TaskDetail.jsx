import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, MapPin, Clock, Calendar } from 'lucide-react';
import MillingProcessChecklist from '@/components/checklists/MillingProcessChecklist';
import BriquetteProductionChecklist from '@/components/checklists/BriquetteProductionChecklist';


export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'in-progress',
        startTime: new Date()
      });
      setTask(prev => ({ ...prev, status: 'in-progress', startTime: new Date() }));
    } catch (err) {
      console.error('Error starting task:', err);
      setError('Failed to start task');
    }
  };

  const handleChecklistComplete = async (submissionData) => {
    try {
      // Save submission to Firestore
      await addDoc(collection(db, 'submissions'), submissionData);

      // Update task status
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'completed',
        endTime: new Date()
      });

      alert('Checklist submitted successfully!');
      navigate('/dashboard/supervisor');
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

      {/* Checklist Form - Show when task is in progress */}
{/* Checklist Forms - Show when task is in progress */}
{task.status === 'in-progress' && (
  <>
    {task.checklistType === 'milling' && (
      <MillingProcessChecklist 
        taskId={taskId}
        onComplete={handleChecklistComplete}
      />
    )}
    
    {task.checklistType === 'briquette' && (
      <BriquetteProductionChecklist 
        taskId={taskId}
        onComplete={handleChecklistComplete}
      />
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