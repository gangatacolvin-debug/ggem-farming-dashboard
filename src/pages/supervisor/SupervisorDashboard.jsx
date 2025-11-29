import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

    // Query tasks assigned to this supervisor for today
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
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-1">View and manage your assigned tasks</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{todayTasks.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {todayTasks.filter(t => t.status === 'completed').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {todayTasks.filter(t => t.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Tasks</CardTitle>
          <CardDescription>Tasks assigned to you for today</CardDescription>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No tasks assigned for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
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
                            <span>Location tracking enabled</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      {task.status === 'pending' && (
                        <Button 
                          onClick={() => navigate(`/dashboard/supervisor/task/${task.id}`)}
                          className="bg-primary"
                        >
                          Start Task
                        </Button>
                      )}
                      {task.status === 'in-progress' && (
                        <Button 
                          onClick={() => navigate(`/dashboard/supervisor/task/${task.id}`)}
                          variant="outline"
                        >
                          Continue
                        </Button>
                      )}
                      {task.status === 'completed' && (
                        <Button 
                          onClick={() => navigate(`/dashboard/supervisor/task/${task.id}`)}
                          variant="ghost"
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}