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
  doc,
  orderBy
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
import {
  Plus,
  Trash2,
  Calendar,
  User,
  ClipboardList,
  Search,
  Filter,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function TaskManagement() {
  const { userDepartment } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

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
      where('department', '==', userDepartment),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
      const tasksData = [];

      for (const taskDoc of snapshot.docs) {
        const taskData = { id: taskDoc.id, ...taskDoc.data() };
        tasksData.push(taskData);
      }

      // Sort primarily by date desc
      tasksData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks snapshot:", error);
      setLoading(false);
    });

    // Fetch supervisors
    const fetchSupervisors = async () => {
      try {
        const supervisorsQuery = query(
          collection(db, 'users'),
          where('department', '==', userDepartment),
          where('role', '==', 'supervisor')
        );
        const snapshot = await getDocs(supervisorsQuery);
        setSupervisors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching supervisors:", err);
      }
    };

    fetchSupervisors();

    return () => unsubscribe();
  }, [userDepartment]);

  const handleCreateTask = async () => {
    setError('');
    setSuccess('');

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
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setSuccess('Task deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Completed</Badge>;
      case 'in-progress': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">In Progress</Badge>;
      case 'pending': return <Badge variant="outline" className="text-gray-600">Pending</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSupervisorName = (id) => {
    const sup = supervisors.find(s => s.id === id);
    return sup ? sup.name : 'Unknown';
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.checklistName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || task.checklistType === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Task Management</h1>
          <p className="text-gray-500 mt-1">Create, assign, and track departmental tasks</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] bg-white">
            <Filter className="w-4 h-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="milling">Milling Process</SelectItem>
            <SelectItem value="briquette">Briquette Production</SelectItem>
            <SelectItem value="hubtransfer">Hub Transfer & Inspection Checklist</SelectItem>
            <SelectItem value="warehouseclosing">Warehouse Closing & Site Inspection</SelectItem>
            <SelectItem value="huboffloading">Offloading Rice from Hubs Checklist</SelectItem>
            <SelectItem value="warehousemaintenance">Warehouse Maintenance Checklist</SelectItem>
            <SelectItem value="warehouseinventory">Warehouse Inventory Audit</SelectItem>
            <SelectItem value="warehouseinventory">Warehouse Inventory Audit</SelectItem>
            <SelectItem value="warehouseinventory">Warehouse Inventory Audit</SelectItem>

          </SelectContent>
        </Select>
      </div>


      {/* Task List Table */}
      <Card className="shadow-sm border-0 bg-white">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Task Name</th>
                  <th className="px-4 py-3">Assigned Supervisor</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No tasks found. Create a new task to get started.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.status === 'in-progress' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                          {task.checklistName}
                        </div>
                        <div className="text-xs text-gray-400 pl-4 mt-0.5 capitalize">{task.checklistType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {getInitials(getSupervisorName(task.assignedTo))}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-gray-700">{getSupervisorName(task.assignedTo)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {task.scheduledDate?.toDate?.()
                              ? new Date(task.scheduledDate.toDate()).toLocaleDateString()
                              : ''}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {task.shift} Shift
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(task.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(task.id)}>
                              Copy Task ID
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTask(task.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Task Assignment</DialogTitle>
            <DialogDescription>
              Create a new checklist assignment for a supervisor.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.checklistType}
                  onValueChange={(val) => {  // ← Also note: it's onValueChange, not onChange for shadcn Select
                    setFormData(prev => ({
                      ...prev,
                      checklistType: val,
                      checklistName: val === 'milling'
                        ? 'Milling Process Checklist'
                        : val === 'briquette'
                          ? 'Briquette Production Checklist'
                          : val === 'hubcollection'
                            ? 'Hub Collection & Offloading Checklist'
                            : val === 'warehousemaintenance'
                              ? 'Warehouse Maintenance Checklist'
                              : val === 'warehouseinventory'
                                ? 'Warehouse Inventory Audit'
                                : 'Unknown Checklist'
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milling">Milling Process</SelectItem>
                    <SelectItem value="briquette">Briquette Production</SelectItem>
                    <SelectItem value="hubcollection">Hub Collection & Offloading</SelectItem>
                    <SelectItem value="warehousemaintenance">Warehouse Maintenance</SelectItem>
                    <SelectItem value="warehouseinventory">Warehouse Inventory Audit</SelectItem>
                    <SelectItem value="warehouseinventory">Warehouse Inventory Audit</SelectItem>
                    <SelectItem value="warehouseinventory">Warehouse Inventory Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Task Name</Label>
                <Input
                  value={formData.checklistName}
                  onChange={e => setFormData({ ...formData, checklistName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assigned Supervisor</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(val) => setFormData({ ...formData, assignedTo: val })}
              >
                <SelectTrigger><SelectValue placeholder="Select supervisor" /></SelectTrigger>
                <SelectContent>
                  {supervisors.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Shift</Label>
                <Select
                  value={formData.shift}
                  onValueChange={(val) => setFormData({ ...formData, shift: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day Shift</SelectItem>
                    <SelectItem value="night">Night Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask}>Assgin Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}