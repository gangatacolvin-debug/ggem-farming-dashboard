import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
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
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

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
  const [chartData, setChartData] = useState([]);

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
        pendingApprovals: tasks.filter(t => t.status === 'pending').length
      };

      setStats(newStats);

      // Get 5 most recent tasks
      const sorted = tasks.sort((a, b) => {
        const dateA = a.scheduledDate?.toDate?.() || new Date(0);
        const dateB = b.scheduledDate?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setRecentTasks(sorted.slice(0, 5));

      // Prepare Chart Data (Tasks per day for the last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const data = last7Days.map(dateStr => {
        const tasksForDay = tasks.filter(t => {
          const tDate = t.scheduledDate?.toDate?.()?.toISOString().split('T')[0];
          return tDate === dateStr;
        });
        return {
          name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
          completed: tasksForDay.filter(t => t.status === 'completed').length,
          pending: tasksForDay.filter(t => t.status !== 'completed').length,
        };
      });

      setChartData(data); // e.g. [{name: 'Mon', completed: 2, pending: 1}, ...]

      setLoading(false);
    }, (error) => {
      console.error("Error fetching dashboard tasks (snapshot):", error);
      setLoading(false);
    });

    // Fetch supervisor count
    const fetchSupervisors = async () => {
      try {
        const supervisorsQuery = query(
          collection(db, 'users'),
          where('department', '==', userDepartment),
          where('role', '==', 'supervisor')
        );
        const snapshot = await getDocs(supervisorsQuery);
        setStats(prev => ({ ...prev, totalSupervisors: snapshot.size }));
      } catch (err) {
        console.error("Error fetching supervisors count:", err);
      }
    };

    fetchSupervisors();

    return () => unsubscribe();
  }, [currentUser, userDepartment]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in-progress': return 'bg-blue-500 hover:bg-blue-600';
      case 'pending': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 capitalize mt-1">
            Welcome back, {currentUser?.email?.split('@')[0]} • {userDepartment} Manager
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/dashboard/manager/tasks')} className="shadow-lg shadow-primary/20">
            <ClipboardList className="w-4 h-4 mr-2" />
            Create New Task
          </Button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Production</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+12%</span>
              <span className="ml-1">from last week</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Operations</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTasks > 0
                ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                : 0}%
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-orange-500 cursor-pointer" onClick={() => navigate('/dashboard/manager/submissions')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Review</CardTitle>
            <AlertCircle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-orange-600/80 mt-1 font-medium">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Main Chart Area */}
        <Card className="col-span-1 lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Production Overview</CardTitle>
            <CardDescription>Task completion status for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="completed" name="Completed" fill="#166534" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="pending" name="Pending/In-Progress" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity / Tasks */}
        <Card className="col-span-1 lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest tasks created or updated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activity
                </div>
              ) : (
                recentTasks.map((task, i) => (
                  <div key={task.id} className="flex items-start space-x-4">
                    <div className={`mt-1 h-2 w-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{task.checklistName}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="mr-1 h-3 w-3" />
                        {task.scheduledDate?.toDate?.()
                          ? new Date(task.scheduledDate.toDate()).toLocaleDateString()
                          : 'No date'}
                        <span className="mx-1">•</span>
                        <span className="capitalize">{task.shift} Shift</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`${getStatusColor(task.status)} text-white border-0`}>
                      {task.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Grid */}
      <h2 className="text-lg font-semibold text-gray-900 mt-2">Quick Access</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-24 hover:bg-gray-50 border-dashed" onClick={() => navigate('/dashboard/manager/tasks')}>
          <div className="flex flex-col items-center gap-2">
            <ClipboardList className="w-6 h-6 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Task Management</span>
          </div>
        </Button>
        <Button variant="outline" className="h-24 hover:bg-gray-50 border-dashed" onClick={() => navigate('/dashboard/manager/monitoring')}>
          <div className="flex flex-col items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Live Monitoring</span>
          </div>
        </Button>
        <Button variant="outline" className="h-24 hover:bg-gray-50 border-dashed" onClick={() => navigate('/dashboard/manager/submissions')}>
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Approvals</span>
          </div>
        </Button>
        <Button variant="outline" className="h-24 hover:bg-gray-50 border-dashed" onClick={() => navigate('/dashboard/manager/reports')}>
          <div className="flex flex-col items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Reports</span>
          </div>
        </Button>
      </div>
    </div>
  );
}