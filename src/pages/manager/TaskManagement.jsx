import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  addDoc,
  deleteDoc,
  doc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Calendar, User, ClipboardList } from 'lucide-react';

export default function TaskManagement() {
  const { userDepartment } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    checklistName: '',
    checklistType: '',
    assignedTo: '',
    scheduledDate: '',
    shift: 'day'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!userDepartment) return;

    // Fetch tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('department', '==', userDepartment)
    );

    const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
      const tasksData = [];
      
      for (const taskDoc of snapshot.docs) {
        const taskData = { id: taskDoc.id, ...taskDoc.data() };
        
        // Fetch supervisor info
        if (taskData.assignedTo) {
          const supervisorDoc = await getDocs(
            query(collection(db, 'users'), where('__name__', '==', taskData.assignedTo))
          );
          if (!supervisorDoc.empty) {
            taskData.supervisorInfo = supervisorDoc.docs[0].data();
          }
        }
        
        tasksData.push(taskData);
      }

      setTasks(tasksData);
      setLoading(false);
    });

    // Fetch supervisors for assignment
    const fetchSupervisors = async () => {
      const supervisorsQuery = query(
        collection(db, 'users'),
        where('department', '==', userDepartment),
        where('role', '==', 'supervisor')
      );
      const snapshot = await getDocs(supervisorsQuery);
      const supervisorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSupervisors(supervisorsData);
    };

    fetchSupervisors();

    return () => unsubscribe();
  }, [userDepartment]);

  const handleCreateTask = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!formData.checklistName || !formData.checklistType || !formData.assignedTo || !formData.scheduledDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const scheduledDate = new Date(formData.scheduledDate);
      
      await addDoc(collection(db, 'tasks'), {
        checklistName: formData.checklistName,
        checklistType: formData.checklistType,
        assignedTo: formData.assignedTo,
        scheduledDate: scheduledDate,
        shift: formData.shift,
        status: 'pending',
        department: userDepartment,
        createdAt: new Date(),
        locationCompliant: null
      });

      setSuccess('Task created successfully!');
      setIsDialogOpen(false);
      setFormData({
        checklistName: '',
        checklistType: '',
        assignedTo: '',
        scheduledDate: '',
        shift: 'day'
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setSuccess('Task deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

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
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Create and assign tasks to your team</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Assign a checklist task to a supervisor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="checklistType">Checklist Type *</Label>
                <Select 
                  value={formData.checklistType} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, checklistType: value });
                    // Auto-set checklist name based on type
                    if (value === 'milling') {
                      setFormData(prev => ({ ...prev, checklistType: value, checklistName: 'Milling Process Checklist' }));
                    } else if (value === 'briquette') {
                      setFormData(prev => ({ ...prev, checklistType: value, checklistName: 'Briquette Production Checklist' }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select checklist type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milling">Milling Process</SelectItem>
                    <SelectItem value="briquette">Briquette Production</SelectItem>
                    <SelectItem value="hub-transfer">Hub Transfer & Inspection</SelectItem>
                    <SelectItem value="warehouse-maintenance">Warehouse Maintenance</SelectItem>
                    <SelectItem value="offloading">Offloading Rice from Hubs</SelectItem>
                    <SelectItem value="loading">Loading Produce for Dispatch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checklistName">Checklist Name *</Label>
                <Input
                  id="checklistName"
                  placeholder="Enter checklist name"
                  value={formData.checklistName}
                  onChange={(e) => setFormData({ ...formData, checklistName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign to Supervisor *</Label>
                <Select 
                  value={formData.assignedTo} 
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No supervisors available</div>
                    ) : (
                      supervisors.map((supervisor) => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>
                          {supervisor.name} ({supervisor.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Shift *</Label>
                <Select 
                  value={formData.shift} 
                  onValueChange={(value) => setFormData({ ...formData, shift: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day Shift</SelectItem>
                    <SelectItem value="night">Night Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} className="bg-primary">
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Message */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>Manage all tasks in your department</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Tasks Yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first task to get started
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold">{task.checklistName}</h4>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{task.supervisorInfo?.name || 'Unassigned'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {task.scheduledDate?.toDate?.() 
                            ? new Date(task.scheduledDate.toDate()).toLocaleDateString()
                            : 'No date'
                          }
                        </span>
                      </div>

                      <span className="capitalize">{task.shift} Shift</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {task.status === 'pending' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
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