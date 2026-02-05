import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function SupervisorDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query tasks assigned to this supervisor
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort tasks by scheduled time
        tasks.sort((a, b) => {
          const dateA = a.scheduledDate?.toDate() || new Date(0);
          const dateB = b.scheduledDate?.toDate() || new Date(0);
          return dateA - dateB;
        });

        setTodayTasks(tasks);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching tasks:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500">Waiting for Approval</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper to categorize tasks
  const categorizedTasks = {
    todo: todayTasks.filter(t => !t.submissionId && (!t.status || (t.status !== 'in-progress' && t.status !== 'approved' && t.status !== 'rejected'))),
    inProgress: todayTasks.filter(t => t.status === 'in-progress'),
    submitted: todayTasks.filter(t => t.submissionId && t.status === 'pending'),
    rejected: todayTasks.filter(t => t.status === 'rejected'),
    approved: todayTasks.filter(t => t.status === 'approved' || t.status === 'completed')
  };

  const EmptyState = ({ message }) => (
    <div className="text-center py-8">
      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <p className="text-gray-500">{message}</p>
    </div>
  );

  const TaskList = ({ tasks, emptyMessage }) => (
    tasks.length === 0 ? <EmptyState message={emptyMessage} /> : (
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="border rounded-lg p-4 hover:border-primary transition-colors bg-card text-card-foreground shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-lg">{task.checklistName || 'Task'}</h3>
                  {getStatusBadge(task.status)}
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(task.scheduledDate?.toDate()).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="capitalize">{task.shift} Shift</span>
                  </div>

                  {task.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{task.location.name || 'Location tracking enabled'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4 flex flex-col gap-2">
                {/* Actions based on status */}
                {(!task.status || (task.status !== 'in-progress' && !task.submissionId)) && (
                  <Button
                    onClick={() => navigate(`/dashboard/supervisor/task/${task.id}`)}
                    size="sm"
                  >
                    Start Task
                  </Button>
                )}

                {task.status === 'in-progress' && (
                  <Button
                    onClick={() => navigate(`/dashboard/supervisor/task/${task.id}`)}
                    variant="outline"
                    size="sm"
                  >
                    Continue
                  </Button>
                )}

                {(task.submissionId || task.status === 'approved' || task.status === 'rejected') && (
                  <Button
                    onClick={() => navigate(`/dashboard/supervisor/task/${task.id}`)}
                    variant="ghost"
                    size="sm"
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600 mt-1">View and manage your assigned tasks</p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate('/dashboard/supervisor/performance')}
          >
            <CheckCircle2 className="w-4 h-4" />
            View My Performance
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{categorizedTasks.todo.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{categorizedTasks.inProgress.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{categorizedTasks.submitted.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{categorizedTasks.approved.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Tabs */}
      <Tabs defaultValue="todo" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="todo">To Do ({categorizedTasks.todo.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({categorizedTasks.inProgress.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({categorizedTasks.submitted.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({categorizedTasks.rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="mt-6">
          <TaskList tasks={categorizedTasks.todo} emptyMessage="No new tasks to start" />
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          <TaskList tasks={categorizedTasks.inProgress} emptyMessage="No tasks currently in progress" />
        </TabsContent>

        <TabsContent value="submitted" className="mt-6">
          <TaskList tasks={categorizedTasks.submitted} emptyMessage="No tasks waiting for approval" />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <TaskList tasks={categorizedTasks.rejected} emptyMessage="No rejected tasks" />
        </TabsContent>
      </Tabs>
    </div>
  );
}