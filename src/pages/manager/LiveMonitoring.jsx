import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LiveMonitoring() {
  const { userDepartment } = useAuth();
  const navigate = useNavigate();
  const [activeTasks, setActiveTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (!userDepartment) return;

    // Query active and pending tasks for this department
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('department', '==', userDepartment),
      where('status', 'in', ['in-progress', 'pending'])
    );

    const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
      const tasksData = [];
      
      for (const taskDoc of snapshot.docs) {
        const taskData = { id: taskDoc.id, ...taskDoc.data() };
        
        // Fetch supervisor info
        if (taskData.assignedTo) {
          const supervisorDoc = await getDoc(doc(db, 'users', taskData.assignedTo));
          if (supervisorDoc.exists()) {
            taskData.supervisorInfo = supervisorDoc.data();
          }
        }
        
        tasksData.push(taskData);
      }

      setActiveTasks(tasksData);
      setLastUpdate(new Date());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userDepartment]);

  const getLocationBadge = (locationCompliant) => {
    if (locationCompliant === null || locationCompliant === undefined) {
      return <Badge variant="outline">Location Unknown</Badge>;
    }
    return locationCompliant ? (
      <Badge className="bg-green-500">
        <MapPin className="w-3 h-3 mr-1" />
        On Site
      </Badge>
    ) : (
      <Badge className="bg-red-500">
        <MapPin className="w-3 h-3 mr-1" />
        Off Site
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in-progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getElapsedTime = (startTime) => {
    if (!startTime) return 'Not started';
    
    const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000 / 60); // minutes
    
    if (diff < 60) return `${diff} min ago`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading monitoring data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Real-time task tracking and compliance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <RefreshCw className="w-4 h-4" />
          <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {activeTasks.filter(t => t.status === 'in-progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Location Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {activeTasks.filter(t => t.locationCompliant === true).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {activeTasks.filter(t => t.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Active & Pending Tasks</CardTitle>
          <CardDescription>
            Monitor all ongoing tasks in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                All Clear!
              </h3>
              <p className="text-gray-500">
                No active or pending tasks at the moment
              </p>
              <Button 
                onClick={() => navigate('/dashboard/manager/tasks')}
                className="mt-4"
              >
                Create New Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTasks.map((task) => (
                <Card key={task.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Task Header */}
                        <div className="flex items-center space-x-2 mb-3">
                          <h3 className="text-lg font-semibold">
                            {task.checklistName || 'Task'}
                          </h3>
                          {getStatusBadge(task.status)}
                          {getLocationBadge(task.locationCompliant)}
                        </div>

                        {/* Task Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {/* Supervisor Info */}
                          <div className="flex items-center space-x-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>
                              {task.supervisorInfo?.name || 'Unknown Supervisor'}
                            </span>
                          </div>

                          {/* Time Info */}
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              {task.status === 'in-progress' 
                                ? `Started ${getElapsedTime(task.startTime)}`
                                : `Scheduled for ${task.scheduledDate?.toDate?.() 
                                    ? new Date(task.scheduledDate.toDate()).toLocaleDateString()
                                    : 'today'
                                  }`
                              }
                            </span>
                          </div>

                          {/* Shift Info */}
                          <div className="text-gray-600">
                            <span className="font-medium">Shift:</span>{' '}
                            <span className="capitalize">{task.shift}</span>
                          </div>

                          {/* Checklist Type */}
                          <div className="text-gray-600">
                            <span className="font-medium">Type:</span>{' '}
                            <span className="capitalize">{task.checklistType}</span>
                          </div>
                        </div>

                        {/* Location Warning */}
                        {task.status === 'in-progress' && task.locationCompliant === false && (
                          <div className="mt-3">
                            <div className="flex items-start space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded">
                              <AlertCircle className="w-4 h-4 mt-0.5" />
                              <div>
                                <p className="font-medium">Location Compliance Issue</p>
                                <p className="text-xs">
                                  Supervisor may not be at the designated work site
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/dashboard/manager/task/${task.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}