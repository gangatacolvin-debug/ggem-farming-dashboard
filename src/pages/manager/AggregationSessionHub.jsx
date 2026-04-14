import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Scale,
  Warehouse,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Lock,
  Unlock,
  Download
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ExportService } from '@/features/aggregation/lib/ExportService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, FileSpreadsheet } from 'lucide-react';

export default function AggregationSessionHub() {
  const { userDepartment } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // 1. Fetch active/recent sessions
  useEffect(() => {
    if (userDepartment !== 'aggregation') return;

    const q = query(
      collection(db, 'aggregationSessions'),
      where('department', '==', 'aggregation')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      
      setSessions(sessionList);
      if (sessionList.length > 0 && !selectedSessionId) {
        setSelectedSessionId(sessionList[0].sessionId);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userDepartment]);

  // 2. Fetch all data for the selected session
  useEffect(() => {
    if (!selectedSessionId) return;

    // Find session document
    const currentSession = sessions.find(s => s.sessionId === selectedSessionId);
    setSessionData(currentSession);

    // Query all submissions for this session
    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('session-id-ref', '==', selectedSessionId)
    );

    // Also check for the initial setup which uses 'session-id'
    const setupQuery = query(
      collection(db, 'submissions'),
      where('session-id', '==', selectedSessionId)
    );

    const fetchData = async () => {
      const [snap1, snap2] = await Promise.all([getDocs(submissionsQuery), getDocs(setupQuery)]);
      const allSubmissions = [
        ...snap1.docs.map(d => ({ id: d.id, ...d.data() })),
        ...snap2.docs.map(d => ({ id: d.id, ...d.data() }))
      ];
      
      // De-duplicate if necessary
      const uniqueSubmissions = Array.from(new Map(allSubmissions.map(s => [s.id, s])).values());
      setSubmissions(uniqueSubmissions);
    };

    fetchData();
  }, [selectedSessionId, sessions, submissions.length]); // Balanced dependency

  const handleSealSession = async () => {
    if (!sessionData?.id) return;

    toast.warning('Seal This Session?', {
      description: "This will make all records read-only and freeze today's logs. This cannot be undone.",
      action: {
        label: 'Seal Session',
        onClick: async () => {
          setActionLoading(true);
          try {
            await updateDoc(doc(db, 'aggregationSessions', sessionData.id), {
              status: 'closed',
              closedAt: serverTimestamp(),
              closedBy: 'Manager'
            });
            toast.success('Session Sealed ✓', {
              description: 'All records are now read-only.',
              duration: 5000,
            });
          } catch (error) {
            console.error("Error sealing session:", error);
            toast.error('Seal Failed', { description: 'Could not seal session. Please try again.' });
          } finally {
            setActionLoading(false);
          }
        },
      },
      duration: 8000,
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Session Hub...</div>;

  const getSub = (type) => submissions.find(s => s.checklistType === type);

  const setup = getSub('pre-aggregation-setup');
  const qc = getSub('aggregation-quality-control');
  const weighing = getSub('aggregation-weighing-recording');
  const warehouse = getSub('aggregation-warehouse-receiving');
  const eod = getSub('aggregation-end-of-day');

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const sealedSessions = sessions.filter((s) => s.status === 'closed');

  const formatTs = (t) => {
    if (!t) return '—';
    if (t?.toDate) return t.toDate().toLocaleString();
    try {
      return new Date(t).toLocaleString();
    } catch {
      return '—';
    }
  };

  const statusBadge = (status) => {
    if (status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <Unlock className="w-3 h-3 mr-1" /> Active
        </Badge>
      );
    }
    if (status === 'closed') {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
          <Lock className="w-3 h-3 mr-1" /> Sealed
        </Badge>
      );
    }
    return <Badge variant="outline">{status || 'unknown'}</Badge>;
  };

  const handlePickSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    setActiveTab('details');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Aggregation Session Hub</h1>
          <p className="text-gray-500 mt-1">Unified monitoring and control for market day operations</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="bg-white border rounded-md px-3 py-2 text-sm font-medium"
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(e.target.value)}
          >
            {sessions.map(s => (
              <option key={s.id} value={s.sessionId}>
                {s.hub?.replace('-', ' ')} - {s.sessionId} ({s.status})
              </option>
            ))}
          </select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => ExportService.generateSessionPDF(sessionData, submissions)}
              >
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                <span>Professional PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => ExportService.generateSessionExcel(sessionData, submissions)}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                <span>Excel Spreadsheet</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[420px]">
          <TabsTrigger value="details">Session Detail</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-6 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Active Sessions</CardTitle>
              <CardDescription>Current market-day sessions that are still open.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeSessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No active sessions.</p>
                ) : (
                  activeSessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handlePickSession(s.sessionId)}
                      className="w-full text-left border rounded-md px-3 py-3 hover:bg-gray-50 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {s.hub?.replaceAll?.('-', ' ') || s.hub || 'Hub'} · {s.sessionId}
                        </div>
                        <div className="text-xs text-gray-500">
                          Opened: {formatTs(s.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(s.status)}
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Sealed / Submitted Sessions</CardTitle>
              <CardDescription>Archived sessions (sealed) that you can review in full detail.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sealedSessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No sealed sessions yet.</p>
                ) : (
                  sealedSessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handlePickSession(s.sessionId)}
                      className="w-full text-left border rounded-md px-3 py-3 hover:bg-gray-50 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {s.hub?.replaceAll?.('-', ' ') || s.hub || 'Hub'} · {s.sessionId}
                        </div>
                        <div className="text-xs text-gray-500">
                          Sealed: {formatTs(s.closedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(s.status)}
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          {!sessionData ? (
            <Alert>
              <AlertDescription>
                No sessions found. Start a session from the Supervisor dashboard (Pre-Aggregation Setup submit).
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Quick Status Bar */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatusCard title="Setup" sub={setup} icon={LayoutDashboard} />
                <StatusCard title="Quality Control" sub={qc} icon={ClipboardCheck} />
                <StatusCard title="Weighing" sub={weighing} icon={Scale} />
                <StatusCard title="Warehouse" sub={warehouse} icon={Warehouse} />
                <StatusCard title="Reconciliation" sub={eod} icon={CheckCircle2} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Left Column: Key Performance Metrics */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Session Overview Card */}
                  <Card className="shadow-sm overflow-hidden border-t-4 border-t-primary">
                    <CardHeader className="bg-gray-50/50">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Master Performance Audit</CardTitle>
                          <CardDescription>Comparison of logs across different stations</CardDescription>
                        </div>
                        {sessionData.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <Unlock className="w-3 h-3 mr-1" /> Active Session
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                            <Lock className="w-3 h-3 mr-1" /> Archived & Sealed
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Farmers</p>
                          <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold">{weighing?.['total-farmers-weighed'] || 0}</span>
                            <span className="text-gray-400 text-sm mb-1">/ {setup?.['expected-farmers'] || '--'} expected</span>
                          </div>
                          <Progress value={(weighing?.['total-farmers-weighed'] / setup?.['expected-farmers']) * 100 || 0} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Total Tonnage</p>
                          <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-green-600">{(weighing?.['total-weight-kg'] || 0).toLocaleString()} kg</span>
                          </div>
                          <p className="text-[10px] text-gray-400">Verified by Warehouse: {warehouse?.['total-weight-received-kg'] || 0} kg</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Total Value</p>
                          <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-blue-600">MWK {(weighing?.['total-gross-amount'] || 0).toLocaleString()}</span>
                          </div>
                          <p className="text-[10px] text-gray-400">Avg MWK/kg: {weighing?.['total-weight-kg'] ? (weighing['total-gross-amount'] / weighing['total-weight-kg']).toFixed(1) : 0}</p>
                        </div>
                      </div>

                      <Separator className="my-6" />

                      <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        Data Reconciliation Check
                      </h4>

                      <div className="space-y-3">
                        <DiscrepancyRow
                          label="Bags Logged vs Received"
                          val1={weighing?.['total-bags-weighed'] || 0}
                          val2={warehouse?.['total-bags-received'] || 0}
                          unit="Bags"
                        />
                        <DiscrepancyRow
                          label="Weight Logged vs Received"
                          val1={weighing?.['total-weight-kg'] || 0}
                          val2={warehouse?.['total-weight-received-kg'] || 0}
                          unit="kg"
                          tolerance={5} // Allow 5kg variance
                        />
                        <DiscrepancyRow
                          label="Farmers Weighed vs Reconciled"
                          val1={weighing?.['total-farmers-weighed'] || 0}
                          val2={eod?.['farmers-attended-today'] || 0}
                          unit="People"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Farmer Weighing Log (Merged View Placeholder) */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Session Weighing Log</CardTitle>
                      <CardDescription>Detailed transaction leaf for this session</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto rounded border">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">Farmer</th>
                              <th className="px-3 py-2 text-left font-semibold">Club</th>
                              <th className="px-3 py-2 text-left font-semibold">Quality</th>
                              <th className="px-3 py-2 text-right font-semibold">Weight</th>
                              <th className="px-3 py-2 text-right font-semibold">Value (MWK)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {weighing?.['farmer-weighing-logs']?.map((log, i) => (
                              <tr key={i} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2 font-medium">{log.farmerName}</td>
                                <td className="px-3 py-2 text-gray-500">{log.clubGroupName}</td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline" className="text-[10px]">{log.variety} - {log.grade}</Badge>
                                </td>
                                <td className="px-3 py-2 text-right font-medium">{log.weightKg} kg</td>
                                <td className="px-3 py-2 text-right font-bold text-blue-600">{Number(log.grossAmount).toLocaleString()}</td>
                              </tr>
                            )) || (
                              <tr><td colSpan="5" className="px-3 py-8 text-center text-gray-400 italic">No weighing logs found for this session yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Session Management */}
                <div className="space-y-6">
                  {/* Team Card */}
                  <Card className="shadow-sm">
                    <CardHeader><CardTitle className="text-base">On-Site Team</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <TeamRow role="Coordinator" name={setup?.['hub-coordinator-name']} present={setup?.['hub-coordinator-present']} />
                      <TeamRow role="Security Lead" name={setup?.['security-lead-name']} present={setup?.['security-team-present']} />
                      <TeamRow role="Warehouse Lead" name={setup?.['warehouse-supervisor-name']} present={setup?.['warehouse-team-present']} />
                      <TeamRow role="Data Lead" name={setup?.['data-team-representative-name']} present={setup?.['data-team-present']} />
                    </CardContent>
                  </Card>

                  {/* QC Breakdown */}
                  <Card className="shadow-sm">
                    <CardHeader><CardTitle className="text-base">Quality Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center bg-red-50 p-3 rounded border border-red-100">
                        <span className="text-sm font-medium text-red-800">Total Rejected</span>
                        <span className="text-xl font-bold text-red-800">{qc?.['batches-rejected-count'] || 0}</span>
                      </div>
                      <div className="flex justify-between items-center bg-orange-50 p-3 rounded border border-orange-100">
                        <span className="text-sm font-medium text-orange-800">Total Downgraded</span>
                        <span className="text-xl font-bold text-orange-800">{qc?.['batches-downgraded-count'] || 0}</span>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 uppercase">Exceptions Reported</p>
                        <p className="text-sm italic text-gray-700">"{qc?.['quality-exceptions-details'] || 'No exceptions reported.'}"</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* FINAL SEAL ACTION */}
                  {sessionData.status === 'active' && (
                    <Card className="bg-blue-600 text-white shadow-xl shadow-blue-200">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Lock className="w-5 h-5" /> Finalize Session
                        </CardTitle>
                        <CardDescription className="text-blue-100">
                          Seal all records and generate the final market day report.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold h-12"
                          onClick={handleSealSession}
                          disabled={actionLoading}
                        >
                          {actionLoading ? "Sealing..." : "SEAL & ARCHIVE SESSION"}
                        </Button>
                        <p className="text-[10px] mt-4 text-center text-blue-100 opacity-70">
                          * This action cannot be undone. All supervisor fields will be locked.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusCard({ title, sub, icon: IconComponent }) {
  const isDone = !!sub;
  return (
    <Card className={`border-none shadow-sm ${isDone ? 'bg-green-50' : 'bg-gray-50'}`}>
      <CardContent className="p-4 flex flex-col items-center gap-2">
        <IconComponent className={`w-5 h-5 ${isDone ? 'text-green-600' : 'text-gray-300'}`} />
        <p className={`text-[10px] font-bold uppercase tracking-wider ${isDone ? 'text-green-800' : 'text-gray-400'}`}>{title}</p>
        <Badge variant={isDone ? 'default' : 'outline'} className={`text-[9px] ${isDone ? 'bg-green-600 hover:bg-green-600' : 'text-gray-400'}`}>
          {isDone ? "Submitted" : "Pending"}
        </Badge>
      </CardContent>
    </Card>
  );
}

function TeamRow({ role, name, present }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-500 uppercase font-semibold">{role}</span>
        <span className="text-sm font-medium">{name || '---'}</span>
      </div>
      {present ? (
        <Badge className="bg-green-100 text-green-700 border-none group-hover:px-4 transition-all">Present</Badge>
      ) : (
        <Badge variant="outline" className="text-gray-300 border-gray-100">Absent</Badge>
      )}
    </div>
  );
}

function DiscrepancyRow({ label, val1, val2, unit, tolerance = 0 }) {
  const diff = Math.abs(val1 - val2);
  const isError = diff > tolerance;
  
  return (
    <div className={`flex items-center justify-between p-3 rounded-md border ${isError ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
       <span className="text-sm font-medium text-gray-700">{label}</span>
       <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
             <div className="flex gap-2 text-xs">
                <span className="text-gray-500">{val1}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">{val2}</span>
             </div>
             {isError ? (
               <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                 <AlertTriangle className="w-2.5 h-2.5" /> Discrepancy: {diff} {unit}
               </span>
             ) : (
               <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                 <CheckCircle2 className="w-2.5 h-2.5" /> Matched
               </span>
             ) }
          </div>
       </div>
    </div>
  );
}
