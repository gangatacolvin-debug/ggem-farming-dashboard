import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, MapPin, User, AlertCircle, PlayCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Import configs to render the structure
import { millingChecklistConfig as millingChecklist } from '@/features/warehousing/config/millingChecklist';
import { briquetteChecklistConfig as briquetteChecklist } from '@/features/warehousing/config/briquetteChecklist';
import { hubCollectionChecklistConfig as hubCollection } from '@/features/warehousing/config/hubCollectionChecklistConfig';
import { hubTransferChecklistConfig as hubTransfer } from '@/features/warehousing/config/hubTransfer';
import { warehouseClosingChecklistConfig as warehouseClosing } from '@/features/warehousing/config/warehouseClosingChecklistConfig';
import { warehouseMaintenanceChecklistConfig as warehouseMaintenance } from '@/features/warehousing/config/warehouseMaintenanceChecklist';
import { warehouseInventoryChecklistConfig as warehouseInventory } from '@/features/warehousing/config/warehouseInventoryChecklist';

export default function ManagerTaskDetail() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!taskId) return;

        const unsubscribe = onSnapshot(doc(db, 'tasks', taskId), (docSnap) => {
            if (docSnap.exists()) {
                setTask({ id: docSnap.id, ...docSnap.data() });
            } else {
                setTask(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [taskId]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading live details...</div>;
    if (!task) return <div className="p-8 text-center text-red-500">Task not found</div>;

    // Determine which config to use
    let config = null;
    switch (task.checklistType) {
        case 'milling': config = millingChecklist; break;
        case 'briquette': config = briquetteChecklist; break;
        case 'hubcollection':
        case 'hub-collection-offloading':
            config = hubCollection;
            break;
        case 'hubtransfer':
        case 'hub-transfer-inspection':
            config = hubTransfer;
            break;
        case 'warehouseclosing':
        case 'warehouse-closing-offloading': // Original legacy ID
        case 'warehouse-closing': // New legacy ID
            config = warehouseClosing;
            break;
        case 'warehousemaintenance':
        case 'warehouse-maintenance':
            config = warehouseMaintenance;
            break;
        case 'warehouseinventory':
        case 'warehouse-inventory':
            config = warehouseInventory;
            break;
        default: config = null;
    }

    const checklistState = task.checklistState || {};
    const checklistProgress = task.checklistProgress || {};
    const currentSectionId = task.currentSection || checklistProgress.currentSection;
    const completedSections = task.completedSections || checklistProgress.completedSections || [];

    // Calculate Progress
    const totalSections = config?.sections?.length || 0;
    const completedCount = completedSections.length;
    const progressPercentage = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{task.checklistName || config?.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> Supervisor ID: {task.assignedTo || 'Unassigned'}</span>
                        <span>•</span>
                        <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'default' : 'secondary'} className="capitalize">
                            {task.status}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Snapshot Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Current Stage</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-blue-600 flex items-center gap-2">
                            <PlayCircle className="w-5 h-5" />
                            {config?.sections.find(s => s.id === currentSectionId)?.title || 'Not Started'}
                        </div>
                        <Progress value={progressPercentage} className="h-2 mt-2" />
                        <p className="text-xs text-gray-500 mt-1">{progressPercentage}% Complete</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Last Updated</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            {task.lastUpdated?.toDate ? task.lastUpdated.toDate().toLocaleTimeString() : 'No updates yet'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Location Status</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold flex items-center gap-2">
                            {task.locationCompliant === true ? (
                                <span className="text-green-600 flex items-center gap-2"><MapPin className="w-4 h-4" /> On Site</span>
                            ) : task.locationCompliant === false ? (
                                <span className="text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Off Site</span>
                            ) : (
                                <span className="text-gray-400">Unknown</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Scheduled Date</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold">
                            {task.scheduledDate?.toDate ? task.scheduledDate.toDate().toLocaleDateString() : 'N/A'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Live Form View */}
            <Card>
                <CardHeader>
                    <CardTitle>Live Form Data</CardTitle>
                </CardHeader>
                <CardContent>
                    {!config ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                            <AlertCircle className="w- mx-auto h-8 text-gray-400 mb-2" />
                            <p>No configuration found for type: <strong>{task.checklistType}</strong></p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {config.sections.map(section => {
                                const isActive = section.id === currentSectionId;
                                const isCompleted = completedSections.includes(section.id);

                                return (
                                    <div
                                        key={section.id}
                                        className={`border rounded-lg p-4 transition-colors ${isActive ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' :
                                            isCompleted ? 'bg-green-50/30 border-green-100' :
                                                'bg-gray-50/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b">
                                            <h3 className={`font-semibold ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                                                {section.title}
                                            </h3>
                                            {isActive && <Badge>In Progress</Badge>}
                                            {isCompleted && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {section.fields.map(field => {
                                                // Handle both flat structure (checklistState) and nested structure (checklistProgress)
                                                let value = checklistProgress[field.id] !== undefined ? checklistProgress[field.id] : checklistState[field.id];

                                                if (field.type === 'log-table') {
                                                    return (
                                                        <div key={field.id} className="col-span-1 md:col-span-2 bg-white p-3 rounded border shadow-sm">
                                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                                {field.label}
                                                            </label>
                                                            <div className="mt-2 overflow-x-auto">
                                                                {Array.isArray(value) && value.length > 0 ? (
                                                                    <table className="w-full text-sm border-collapse">
                                                                        <thead>
                                                                            <tr className="bg-gray-50 border-b">
                                                                                {field.columns?.map(col => (
                                                                                    <th key={col.key} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                                                                                        {col.label}
                                                                                    </th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y">
                                                                            {value.map((row, idx) => (
                                                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                                                    {field.columns?.map(col => (
                                                                                        <td key={col.key} className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                                                                            {row[col.key] || '-'}
                                                                                        </td>
                                                                                    ))}
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                ) : (
                                                                    <p className="text-sm text-gray-400 italic py-2">No entries yet.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={field.id} className="bg-white p-3 rounded border shadow-sm">
                                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                            {field.label}
                                                        </label>
                                                        <div className="mt-1 font-medium text-gray-900 break-words">
                                                            {value === true ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Yes</span>
                                                                : value === false ? <span className="text-red-600">No</span>
                                                                    : (typeof value === 'object' && value !== null) ? <pre className="text-xs bg-gray-100 p-1 rounded overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                                                                        : value || <span className="text-gray-300 italic">Empty</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
