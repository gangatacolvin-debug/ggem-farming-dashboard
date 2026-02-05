import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, User } from 'lucide-react';

export default function ManagerSchedules() {
    const { userDepartment } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        type: '',
        supervisor: '',
        shift: 'day'
    });

    // Week generation
    const getDaysOfWeek = (date) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay() + 1); // Start Monday
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getDaysOfWeek(currentDate);

    useEffect(() => {
        if (!userDepartment) return;

        // Fetch supervisors
        const fetchSups = async () => {
            const q = query(
                collection(db, 'users'),
                where('department', '==', userDepartment),
                where('role', '==', 'supervisor')
            );
            const snap = await getDocs(q);
            setSupervisors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchSups();

        // Fetch tasks for the query range (simplified to all for now or optimize later)
        const qTasks = query(
            collection(db, 'tasks'),
            where('department', '==', userDepartment)
        );
        const unsub = onSnapshot(qTasks, (snap) => {
            setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => unsub();
    }, [userDepartment]);

    const handleCreateSchedule = async () => {
        if (!selectedDate || !newTask.type || !newTask.supervisor) return;

        try {
            await addDoc(collection(db, 'tasks'), {
                checklistName: newTask.type === 'milling' ? 'Milling Process Checklist' : 'Briquette Production Checklist',
                checklistType: newTask.type,
                assignedTo: newTask.supervisor,
                scheduledDate: selectedDate,
                shift: newTask.shift,
                status: 'pending',
                department: userDepartment,
                createdAt: new Date(),
                locationCompliant: null
            });
            setIsDialogOpen(false);
            setNewTask({ type: '', supervisor: '', shift: 'day' });
        } catch (e) {
            console.error(e);
        }
    };

    const getTasksForDate = (date) => {
        return tasks.filter(t => {
            if (!t.scheduledDate) return false;
            const tDate = t.scheduledDate.toDate ? t.scheduledDate.toDate() : new Date(t.scheduledDate);
            return tDate.toDateString() === date.toDateString();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
                    <p className="text-gray-600">Weekly Shift and Task Planning</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => {
                        const d = new Date(currentDate);
                        d.setDate(d.getDate() - 7);
                        setCurrentDate(d);
                    }}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-medium min-w-[150px] text-center">
                        {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
                    </span>
                    <Button variant="outline" onClick={() => {
                        const d = new Date(currentDate);
                        d.setDate(d.getDate() + 7);
                        setCurrentDate(d);
                    }}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
                {weekDays.map(day => (
                    <div key={day.toISOString()} className="space-y-2">
                        <div className={`p-2 text-center rounded-lg font-medium ${day.toDateString() === new Date().toDateString()
                            ? 'bg-primary text-white'
                            : 'bg-gray-100'
                            }`}>
                            <div className="text-xs uppercase opacity-75">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className="text-lg">{day.getDate()}</div>
                        </div>

                        <div className="min-h-[400px] border rounded-lg p-2 space-y-2 bg-gray-50/50">
                            {getTasksForDate(day).map(task => (
                                <Card
                                    key={task.id}
                                    className="p-2 cursor-pointer hover:shadow-md transition-shadow hover:ring-2 hover:ring-primary/50"
                                    onClick={() => window.location.href = `/dashboard/manager/task/${task.id}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <Badge variant="outline" className="text-[10px] px-1 h-5">{task.shift}</Badge>
                                        <span className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                                            task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                                            }`} />
                                    </div>
                                    <p className="font-medium text-xs line-clamp-2 mb-1">{task.checklistName}</p>
                                    <div className="flex items-center text-[10px] text-gray-500">
                                        <User className="w-3 h-3 mr-1" />
                                        <span className="truncate">
                                            {supervisors.find(s => s.id === task.assignedTo)?.name || 'Unassigned'}
                                        </span>
                                    </div>
                                </Card>
                            ))}

                            <Button
                                variant="ghost"
                                className="w-full border-2 border-dashed border-gray-200 hover:border-primary hover:text-primary"
                                onClick={() => {
                                    setSelectedDate(day);
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Task for {selectedDate?.toLocaleDateString()}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Checklist Type</Label>
                            <Select onValueChange={(v) => setNewTask({ ...newTask, type: v })}>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="milling">Milling Process</SelectItem>
                                    <SelectItem value="briquette">Briquette Production</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Supervisor</Label>
                            <Select onValueChange={(v) => setNewTask({ ...newTask, supervisor: v })}>
                                <SelectTrigger><SelectValue placeholder="Select supervisor" /></SelectTrigger>
                                <SelectContent>
                                    {supervisors.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Shift</Label>
                            <Select defaultValue="day" onValueChange={(v) => setNewTask({ ...newTask, shift: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Day Shift</SelectItem>
                                    <SelectItem value="night">Night Shift</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateSchedule}>Create Schedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
