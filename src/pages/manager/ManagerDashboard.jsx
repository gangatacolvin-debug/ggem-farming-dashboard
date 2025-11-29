import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ManagerDashboard() {
  const { currentUser, userDepartment } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalSupervisors: 0,
    pendingApprovals: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !userDepartment) return;
    

    // Fetch all tasks for this department
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('department', '==', userDepartment)
    );

    
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate stats
      const newStats = {
        totalTasks: tasks.length,
        activeTasks: tasks.filter(t => t.status === 'in-progress').length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        totalSupervisors: 0, // Will fetch separately
        pendingApprovals: 0 // Will fetch from submissions
      };

      setStats(newStats);
      
      // Get 5 most recent tasks
      const sorted = tasks.sort((a, b) => {
        const dateA = a.scheduledDate?.toDate?.() || new Date(0);
        const dateB = b.scheduledDate?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setRecentTasks(sorted.slice(0, 5));

      setLoading(false);
    });

    // Fetch supervisor count
    const fetchSupervisors = async () => {
      const supervisorsQuery = query(
        collection(db, 'users'),
        where('department', '==', userDepartment),
        where('role', '==', 'supervisor')
      );
      const snapshot = await getDocs(supervisorsQuery);
      setStats(prev => ({ ...prev, totalSupervisors: snapshot.size }));
    };

    fetchSupervisors();

    const fetchPendingSubmissions = async () => {
  const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
  let pendingCount = 0;
  
  for (const subDoc of submissionsSnapshot.docs) {
    const subData = subDoc.data();
    
    if (!subData.status || subData.status === 'pending') {
      if (subData.taskId) {
        const taskDoc = await getDoc(doc(db, 'tasks', subData.taskId));
        if (taskDoc.exists() && taskDoc.data().department === userDepartment) {
          pendingCount++;
        }
      }
    }
  }
  
  setStats(prev => ({ ...prev, pendingApprovals: pendingCount }));
};

fetchPendingSubmissions();

    return () => unsubscribe();
  }, [currentUser, userDepartment]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-1 capitalize">
          {userDepartment} Department Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tasks
            </CardTitle>
            <ClipboardList className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-gray-500 mt-1">All department tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Tasks
            </CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting start</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Team Members
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalSupervisors}</div>
            <p className="text-xs text-gray-500 mt-1">Active supervisors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Approvals
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting your review</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button 
          onClick={() => navigate('/dashboard/manager/tasks')}
          className="h-20 bg-primary text-white"
        >
          <div className="flex flex-col items-center">
            <ClipboardList className="w-6 h-6 mb-1" />
            <span>Manage Tasks</span>
          </div>
        </Button>

        <Button 
          onClick={() => navigate('/dashboard/manager/monitoring')}
          variant="outline"
          className="h-20"
        >
          <div className="flex flex-col items-center">
            <Clock className="w-6 h-6 mb-1" />
            <span>Live Monitoring</span>
          </div>
        </Button>

         <Button 
    onClick={() => navigate('/dashboard/manager/submissions')}
    variant="outline"
    className="h-20 relative"
  >
    <div className="flex flex-col items-center">
      <CheckCircle2 className="w-6 h-6 mb-1" />
      <span>Review Submissions</span>
    </div>
    {stats.pendingApprovals > 0 && (
      <Badge className="absolute top-2 right-2 bg-red-500">
        {stats.pendingApprovals}
      </Badge>
    )}
  </Button>

        <Button 
          onClick={() => navigate('/dashboard/manager/schedules')}
          variant="outline"
          className="h-20"
        >
          <div className="flex flex-col items-center">
            <Calendar className="w-6 h-6 mb-1" />
            <span>Schedules</span>
          </div>
        </Button>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Latest tasks in your department</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No tasks found</p>
              <Button 
                onClick={() => navigate('/dashboard/manager/tasks')}
                className="mt-4"
                variant="outline"
              >
                Create Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{task.checklistName || 'Task'}</h4>
                    <p className="text-sm text-gray-500">
                      {task.scheduledDate?.toDate?.() 
                        ? new Date(task.scheduledDate.toDate()).toLocaleDateString()
                        : 'No date'
                      } • {task.shift} shift
                    </p>
                  </div>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}