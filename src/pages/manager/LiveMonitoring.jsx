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
  RefreshCw,
  CheckSquare,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

// Import configs for progress calculation
import { millingChecklistConfig } from '@/features/warehousing/config/millingChecklist';
import { briquetteChecklistConfig } from '@/features/warehousing/config/briquetteChecklist';
import { hubCollectionChecklistConfig as hubCollection } from '@/features/warehousing/config/hubCollectionChecklistConfig';
import { hubTransferChecklistConfig as hubTransfer } from '@/features/warehousing/config/hubTransfer';
import { warehouseClosingChecklistConfig as warehouseClosing } from '@/features/warehousing/config/warehouseClosingChecklistConfig';
import { warehouseMaintenanceChecklistConfig as warehouseMaintenance } from '@/features/warehousing/config/warehouseMaintenanceChecklist';
import { warehouseInventoryChecklistConfig as warehouseInventory } from '@/features/warehousing/config/warehouseInventoryChecklist';

const CHECKLIST_CONFIGS = {
  'milling': millingChecklistConfig,
  'briquette': briquetteChecklistConfig,
  'hubcollection': hubCollection,
  'hubtransfer': hubTransfer,
  'warehouseclosing': warehouseClosing,
  'warehousemaintenance': warehouseMaintenance,
  'warehouseinventory': warehouseInventory,
  // Legacy mappings
  'hub-collection-offloading': hubCollection,
  'hub-transfer-inspection': hubTransfer,
  'warehouse-closing-offloading': warehouseClosing,
  'warehouse-maintenance': warehouseMaintenance,
  'warehouse-inventory': warehouseInventory
};

export default function LiveMonitoring() {
  const { userDepartment } = useAuth();
  const navigate = useNavigate();
  const [activeTasks, setActiveTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (!userDepartment) return;

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('department', '==', userDepartment),
      where('status', 'in', ['in-progress', 'pending'])
    );

    const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
      const tasksData = [];

      for (const taskDoc of snapshot.docs) {
        const taskData = { id: taskDoc.id, ...taskDoc.data() };
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
    }, (error) => {
      console.error("Error fetching live tasks (snapshot):", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userDepartment]);

  const getLocationBadge = (locationCompliant) => {
    if (locationCompliant === null || locationCompliant === undefined) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">Location Unknown</Badge>;
    }
    return locationCompliant ? (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
        <MapPin className="w-3 h-3 mr-1" /> On Site
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 animate-pulse">
        <MapPin className="w-3 h-3 mr-1" /> Off Site
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in-progress': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">In Progress</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Pending Start</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = (task) => {
    // 1. Resolve Config
    const config = CHECKLIST_CONFIGS[task.checklistType];
    if (!config) return 0;

    // 2. Determine Total Sections
    const totalSections = config.sections?.length || 1; // Prevent division by zero

    // 3. Determine Completed Sections
    // Try the accurate 'completedSections' array first
    let completedCount = 0;
    if (Array.isArray(task.completedSections)) {
      completedCount = task.completedSections.length;
    } else if (task.checklistProgress?.completedSections?.length) {
      completedCount = task.checklistProgress.completedSections.length;
    }
    // Fallback to legacy 'currentStep' logic
    else if (task.checklistProgress?.currentStep) {
      completedCount = task.checklistProgress.currentStep - 1; // If on step 1, 0 completed
    }

    // 4. Calculate Percentage
    const percentage = Math.round((completedCount / totalSections) * 100);

    // Safety clamp (0-100) and NaN check
    if (isNaN(percentage)) return 0;
    return Math.min(100, Math.max(0, percentage));
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const inProgressCount = activeTasks.filter(t => t.status === 'in-progress').length;
  const compliantCount = activeTasks.filter(t => t.locationCompliant === true).length;
  const pendingCount = activeTasks.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Operations</h1>
          <p className="text-gray-600 mt-1">Real-time supervision and compliance tracking</p>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-1 text-gray-500 bg-white shadow-sm">
          <Activity className="w-3 h-3 mr-2 text-green-500 animate-pulse" />
          Live Updating • Last update: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Active Tasks</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{inProgressCount}</div>
            <p className="text-xs text-blue-600 font-medium mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Location Compliant</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{compliantCount}</div>
            <p className="text-xs text-green-600 font-medium mt-1">Supervisors on site</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Pending Start</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{pendingCount}</div>
            <p className="text-xs text-orange-600 font-medium mt-1">Scheduled but not started</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="grid gap-6">
        <h2 className="text-xl font-semibold text-gray-900">Ongoing Operations</h2>

        {activeTasks.length === 0 ? (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900">No active operations</p>
              <p className="text-gray-500 mb-4">Everything is quiet for now.</p>
              <Button variant="outline" onClick={() => navigate('/dashboard/manager/tasks')}>Initialize New Task</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTasks.map((task) => (
              <Card key={task.id} className="overflow-hidden hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary group">
                <CardHeader className="pb-3 bg-gray-50/50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        {task.checklistName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3" /> {task.supervisorInfo?.name || 'Unassigned'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Status Indicators */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {getLocationBadge(task.locationCompliant)}
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.shift} Shift
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="hidden group-hover:flex" onClick={() => navigate(`/dashboard/manager/task/${task.id}`)}>
                        View Details <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </div>

                    {/* Progress Bar (simulated for now if not present) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Checklist Progress</span>
                        <span>{Math.round(calculateProgress(task))}%</span>
                      </div>
                      <Progress value={calculateProgress(task)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}