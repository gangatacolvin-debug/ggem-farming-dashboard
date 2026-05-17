import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
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
import { normalizeDepartment } from '@/lib/departmentNormalize';

export default function ManagerDashboard() {
  const { currentUser, userDepartment, loading: authLoading } = useAuth();
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

  // Flag Panel State
  const [flags, setFlags] = useState([]);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [flagActionLoading, setFlagActionLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser || !userDepartment) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const normalizedDept = normalizeDepartment(userDepartment);

    // Fetch all tasks for this department
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('department', '==', normalizedDept)
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
        completedTasks: tasks.filter(t => t.status === 'completed' || t.status === 'approved').length,
        // Only count tasks that have a submissionId (truly submitted) as pending approvals
        pendingTasks: tasks.filter(t => t.status === 'pending' && t.submissionId).length,
        totalSupervisors: 0, // Will fetch separately
        pendingApprovals: tasks.filter(t => t.status === 'pending' && t.submissionId).length
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
          where('department', '==', normalizedDept),
          where('role', '==', 'supervisor')
        );
        const snapshot = await getDocs(supervisorsQuery);
        setStats(prev => ({ ...prev, totalSupervisors: snapshot.size }));
      } catch (err) {
        console.error("Error fetching supervisors count:", err);
      }
    };

    fetchSupervisors();

    // Fetch active flags for Real-Time Panel
    // NOTE: Only filter by department to avoid composite index requirement.
    // Status filtering is done client-side.
    const flagsQuery = query(
      collection(db, 'flags'),
      where('department', '==', normalizedDept)
    );
    const flagsUnsubscribe = onSnapshot(flagsQuery, (snapshot) => {
      const activeStatuses = ['open', 'acknowledged', 'action-taken'];
      const flagsData = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(f => activeStatuses.includes(f.status));
      flagsData.sort((a, b) => (b.triggeredAt?.toMillis?.() || 0) - (a.triggeredAt?.toMillis?.() || 0));
      setFlags(flagsData);
    }, (err) => {
      console.error('Flags snapshot error:', err);
    });

    return () => {
      unsubscribe();
      flagsUnsubscribe();
    };
  }, [currentUser, userDepartment, authLoading]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in-progress': return 'bg-blue-500 hover:bg-blue-600';
      case 'pending': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const handleFlagAction = async (actionStage) => {
    if (!selectedFlag) return;
    setFlagActionLoading(true);
    const flagRef = doc(db, 'flags', selectedFlag.id);
    const nowMillis = Date.now();
    const triggeredMillis = selectedFlag.triggeredAt?.toMillis?.() || nowMillis;

    try {
      if (actionStage === 'acknowledge') {
        await updateDoc(flagRef, {
          status: 'acknowledged',
          acknowledgedAt: serverTimestamp(),
          acknowledgedBy: currentUser.uid,
          acknowledgedByName: currentUser.displayName || currentUser.email || 'Manager',
          responseTimeSeconds: Math.floor((nowMillis - triggeredMillis) / 1000)
        });
      } else if (actionStage === 'action-taken') {
        if (!actionType || !actionNotes) throw new Error("Action type and notes required");
        await updateDoc(flagRef, {
          status: 'action-taken',
          actionTakenAt: serverTimestamp(),
          actionTakenBy: currentUser.uid,
          actionTakenByName: currentUser.displayName || currentUser.email || 'Manager',
          actionType: actionType,
          actionNotes: actionNotes
        });
      } else if (actionStage === 'resolve') {
        if (!actionNotes) throw new Error("Resolution notes required");
        await updateDoc(flagRef, {
          status: 'resolved',
          resolvedAt: serverTimestamp(),
          resolvedBy: currentUser.uid,
          resolvedByName: currentUser.displayName || currentUser.email || 'Manager',
          resolutionNotes: actionNotes,
          resolutionTimeSeconds: Math.floor((nowMillis - triggeredMillis) / 1000)
        });
        setIsFlagDialogOpen(false);
      } else if (actionStage === 'escalate') {
        if (!actionNotes) throw new Error("Escalation reason required");
        await updateDoc(flagRef, {
          status: 'escalated',
          escalatedAt: serverTimestamp(),
          escalatedBy: currentUser.uid,
          escalatedByName: currentUser.displayName || currentUser.email || 'Manager',
          escalatedTo: 'leadership',
          escalationReason: actionNotes
        });
        setIsFlagDialogOpen(false);
      }
      
      if (['acknowledge', 'action-taken'].includes(actionStage)) {
         setSelectedFlag({...selectedFlag, status: actionStage});
         setActionType('');
         setActionNotes('');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update flag');
    } finally {
      setFlagActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userDepartment) {
    return (
      <div className="max-w-lg space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Department missing on your profile</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              The manager dashboard filters tasks by your <code className="text-xs bg-muted px-1 rounded">department</code>{' '}
              field in Firestore. Yours is not set, so the page cannot load data.
            </p>
            <p className="text-sm">
              In Firebase Console → Firestore → <code className="text-xs bg-muted px-1 rounded">users</code> → your user
              document, add a string field <strong>department</strong> with the same value used on tasks (e.g.{' '}
              <code className="text-xs bg-muted px-1 rounded">aggregation</code>), plus{' '}
              <strong>role</strong>: <code className="text-xs bg-muted px-1 rounded">manager</code>.
            </p>
            <p className="text-sm">After saving, refresh this page.</p>
          </AlertDescription>
        </Alert>
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

      {/* Real-Time Flags Panel */}
      {flags.length > 0 && (
        <Card className="border-red-200 bg-red-50/10">
          <CardHeader className="pb-3 border-b bg-white rounded-t-lg flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <CardTitle className="text-red-700">Active Alerts & Flags ({flags.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50">
            {flags.map(flag => (
              <div 
                key={flag.id} 
                onClick={() => { setSelectedFlag(flag); setIsFlagDialogOpen(true); setActionType(''); setActionNotes(''); }}
                className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                  flag.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  flag.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                } ${flag.status === 'open' && flag.severity === 'critical' ? 'animate-pulse' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={flag.status === 'open' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                    {flag.status}
                  </Badge>
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {flag.triggeredAt ? Math.floor((Date.now() - flag.triggeredAt.toMillis()) / 60000) : 0}m ago
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 leading-tight mb-1">{flag.fieldLabel}</h4>
                <p className="text-xs text-gray-600 truncate">{flag.supervisorName} • {flag.checklistType}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
                recentTasks.map((task) => (
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

      {/* Flag Dialog */}
      <Dialog open={isFlagDialogOpen} onOpenChange={setIsFlagDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Flag Audit Trail
            </DialogTitle>
            <DialogDescription>
              Manage and track actions for this active alert.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFlag && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 p-3 rounded-lg border">
                <h3 className="font-bold">{selectedFlag.fieldLabel}</h3>
                <p className="text-sm text-gray-600">{selectedFlag.message}</p>
                <div className="mt-2 text-xs text-gray-500 flex gap-4">
                  <span><strong>By:</strong> {selectedFlag.supervisorName}</span>
                  <span><strong>Checklist:</strong> <span className="capitalize">{selectedFlag.checklistType}</span></span>
                </div>
              </div>

              {/* Audit Trail UI */}
              <div className="space-y-3 border-l-2 border-gray-200 pl-4 ml-2">
                <div className="relative">
                  <div className="absolute w-2 h-2 bg-gray-400 rounded-full -left-[21px] top-1.5 border border-white"></div>
                  <p className="text-xs font-semibold text-gray-600">Triggered</p>
                  <p className="text-xs text-gray-500">{selectedFlag.triggeredAt?.toDate()?.toLocaleString()}</p>
                </div>
                
                {selectedFlag.acknowledgedAt && (
                  <div className="relative">
                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[21px] top-1.5 border border-white"></div>
                    <p className="text-xs font-semibold text-gray-600">Acknowledged by {selectedFlag.acknowledgedByName}</p>
                    <p className="text-xs text-gray-500">{selectedFlag.acknowledgedAt?.toDate()?.toLocaleString()}</p>
                  </div>
                )}

                {selectedFlag.actionTakenAt && (
                  <div className="relative">
                    <div className="absolute w-2 h-2 bg-purple-500 rounded-full -left-[21px] top-1.5 border border-white"></div>
                    <p className="text-xs font-semibold text-gray-600">Action: {selectedFlag.actionType}</p>
                    <p className="text-xs text-gray-500 italic">"{selectedFlag.actionNotes}"</p>
                    <p className="text-xs text-gray-400">{selectedFlag.actionTakenAt?.toDate()?.toLocaleString()} by {selectedFlag.actionTakenByName}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Action Controls */}
              {selectedFlag.status === 'open' && (
                <Button className="w-full" onClick={() => handleFlagAction('acknowledge')} disabled={flagActionLoading}>
                  {flagActionLoading ? 'Processing...' : 'Acknowledge Flag'}
                </Button>
              )}

              {selectedFlag.status === 'acknowledged' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Action Type</Label>
                    <Select value={actionType} onValueChange={setActionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action taken..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stopped the session">Stopped the session</SelectItem>
                        <SelectItem value="Instructed supervisor to continue with caution">Instructed supervisor to continue with caution</SelectItem>
                        <SelectItem value="Dispatched support to location">Dispatched support to location</SelectItem>
                        <SelectItem value="Logged for end of day review">Logged for end of day review</SelectItem>
                        <SelectItem value="No action required — false alarm">No action required — false alarm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Action Notes</Label>
                    <Textarea 
                      placeholder="Detail the action taken..." 
                      value={actionNotes}
                      onChange={e => setActionNotes(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleFlagAction('action-taken')} 
                    disabled={!actionType || !actionNotes || flagActionLoading}
                  >
                    {flagActionLoading ? 'Processing...' : 'Record Action'}
                  </Button>
                </div>
              )}

              {selectedFlag.status === 'action-taken' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Resolution or Escalation Notes</Label>
                    <Textarea 
                      placeholder="Explain how this was resolved, or why it is being escalated..." 
                      value={actionNotes}
                      onChange={e => setActionNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1 text-orange-600 border-orange-200" 
                      onClick={() => handleFlagAction('escalate')} 
                      disabled={!actionNotes || flagActionLoading}
                    >
                      {flagActionLoading ? 'Processing...' : 'Escalate'}
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      onClick={() => handleFlagAction('resolve')} 
                      disabled={!actionNotes || flagActionLoading}
                    >
                      {flagActionLoading ? 'Processing...' : 'Mark Resolved'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}