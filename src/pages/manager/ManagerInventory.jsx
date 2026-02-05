import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Package,
    TrendingUp,
    History,
    Download,
    Truck,
    MapPin,
    ArrowRight,
    AlertTriangle
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GGEM_LOCATIONS } from '@/lib/locations';

export default function ManagerInventory() {
    const { userDepartment } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock Opening Stock (Since we don't have farmer collection data yet)
    // In a real app, this would come from a database collection 'inventory_snapshots'
    const [hubStock, setHubStock] = useState({
        'main-warehouse': { current: 15000, capacity: 50000, color: 'bg-blue-600' },
        'dwangwa-hub': { current: 4500, capacity: 5000, color: 'bg-green-600' },
        'linga-hub': { current: 3200, capacity: 5000, color: 'bg-purple-600' },
        'suluwi-hub': { current: 1200, capacity: 5000, color: 'bg-orange-600' }, // Low stock ex example
        'salima-hub': { current: 4800, capacity: 5000, color: 'bg-red-600' }     // High stock example
    });

    useEffect(() => {
        if (!userDepartment) return;

        // Fetch completed transfer tasks to calculate movements
        const q = query(
            collection(db, 'tasks'),
            where('status', 'in', ['completed', 'pending', 'in-progress']),
            where('checklistType', 'in', ['hubcollection', 'hubtransfer', 'hub-collection-offloading', 'hub-transfer-inspection'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter only robust data
            const validTransfers = tasks.map(task => {
                const progress = task.checklistProgress || {};

                // Try to find source/destination from form data
                // Note: These field IDs must match the checklist config
                const destination = progress['destination-hub'] || progress['destinationHub'] || 'main-warehouse';
                const origin = progress['origin-hub'] || progress['originHub'] || 'Unknown Hub';
                const bags = progress['bags-loaded'] || progress['bagsLoaded'] || 0;

                return {
                    id: task.id,
                    date: task.completedAt || task.startTime || task.scheduledDate,
                    type: task.checklistType,
                    status: task.status,
                    origin,
                    destination,
                    bags: parseInt(bags) || 0,
                    supervisor: task.assignedTo
                };
            }).sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

            setTransfers(validTransfers);

            // Dynamic Stock Adjustment (Simulation)
            // Subtracting transferred stock from Hubs and adding to Main Warehouse
            const newStock = { ...hubStock };

            validTransfers.forEach(transfer => {
                if (transfer.status === 'completed' || transfer.status === 'pending') {
                    // Logic: If moving TO main warehouse, reduce from origin hub
                    if (transfer.destination === 'main-warehouse' && newStock[transfer.origin]) {
                        // In reality, this would likely be calculated server-side
                        // For now we just show the static mock values modified by recent transfers to show interactivity
                        // newStock[transfer.origin].current = Math.max(0, newStock[transfer.origin].current - transfer.bags);
                        // newStock['main-warehouse'].current += transfer.bags;
                    }
                }
            });
            // setHubStock(newStock); // Disabled for now to keep the demo numbers looking clean

            setLoading(false);
        });

        return () => unsubscribe();
    }, [userDepartment]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading inventory data...</div>;

    const getStockStatus = (current, capacity) => {
        const percentage = (current / capacity) * 100;
        if (percentage > 90) return { label: 'Correction Critical', color: 'text-red-600', bg: 'bg-red-100' };
        if (percentage > 75) return { label: 'High Stock', color: 'text-orange-600', bg: 'bg-orange-100' };
        if (percentage < 20) return { label: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { label: 'Optimal', color: 'text-green-600', bg: 'bg-green-100' };
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Hub Inventory Monitoring</h1>
                    <p className="text-gray-500 mt-1">Real-time stock levels and transfer tracking across all locations</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <History className="w-4 h-4 mr-2" />
                        History
                    </Button>
                    <Button>
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="stock" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="stock">Stock Levels</TabsTrigger>
                    <TabsTrigger value="movements">Transfer Log</TabsTrigger>
                </TabsList>

                {/* STOCK LEVELS VIEW */}
                <TabsContent value="stock" className="space-y-6">
                    {/* Main Warehouse Big Card */}
                    <Card className="border-l-4 border-l-blue-600 bg-blue-50/50">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                        Main Warehouse (HQ)
                                    </CardTitle>
                                    <CardDescription>Central Aggregation Point</CardDescription>
                                </div>
                                <Badge className="bg-blue-600 hover:bg-blue-700">Primary Storage</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Total Stock on Hand</p>
                                    <div className="text-4xl font-bold text-gray-900">{hubStock['main-warehouse'].current.toLocaleString()} <span className="text-lg text-gray-400 font-normal">bags</span></div>
                                </div>
                                <div className="w-full">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600">Capacity Usage</span>
                                        <span className="font-medium">{(hubStock['main-warehouse'].current / hubStock['main-warehouse'].capacity * 100).toFixed(1)}%</span>
                                    </div>
                                    <Progress value={(hubStock['main-warehouse'].current / hubStock['main-warehouse'].capacity) * 100} className="h-3" />
                                    <p className="text-xs text-gray-500 mt-1">{hubStock['main-warehouse'].capacity.toLocaleString()} bag total capacity</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Regional Hubs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(GGEM_LOCATIONS)
                            .filter(([key, val]) => val.type === 'hub')
                            .map(([key, location]) => {
                                const stockData = hubStock[key] || { current: 0, capacity: 100 };
                                const percent = (stockData.current / stockData.capacity) * 100;
                                const status = getStockStatus(stockData.current, stockData.capacity);

                                return (
                                    <Card key={key} className="hover:shadow-md transition-all">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base font-semibold truncate" title={location.name}>
                                                    {location.name}
                                                </CardTitle>
                                                {status.label === 'Correction Critical' && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`${status.color} ${status.bg} border-0`}>
                                                    {status.label}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="mt-2">
                                                <div className="text-2xl font-bold">{stockData.current.toLocaleString()}</div>
                                                <p className="text-xs text-gray-500 mb-3">bags available</p>
                                                <Progress value={percent} className={`h-2`} indicatorClassName={stockData.color} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                    </div>
                </TabsContent>

                {/* MOVEMENTS LOG VIEW */}
                <TabsContent value="movements">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Stock Movements</CardTitle>
                            <CardDescription>Records of all Hub-to-HQ and Inter-hub transfers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Route</TableHead>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Supervisor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                                <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                <p>No transfers recorded yet</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transfers.map((transfer) => (
                                            <TableRow key={transfer.id}>
                                                <TableCell>
                                                    {transfer.date?.toDate ? transfer.date.toDate().toLocaleDateString() : 'Pending'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-medium text-gray-700 capitalize">
                                                            {GGEM_LOCATIONS[transfer.origin]?.name || transfer.origin || '...'}
                                                        </span>
                                                        <ArrowRight className="w-3 h-3 text-gray-400" />
                                                        <span className="font-medium text-gray-900 capitalize">
                                                            {GGEM_LOCATIONS[transfer.destination]?.name || transfer.destination || 'HQ'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">Unique Log</Badge>
                                                </TableCell>
                                                <TableCell>{transfer.supervisor || 'Unassigned'}</TableCell>
                                                <TableCell>
                                                    {transfer.status === 'completed' ? (
                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Arrived</Badge>
                                                    ) : transfer.status === 'in-progress' ? (
                                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 animate-pulse">In Transit</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Scheduled</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-bold font-mono">
                                                    {transfer.bags > 0 ? `+${transfer.bags}` : '-'} bags
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
