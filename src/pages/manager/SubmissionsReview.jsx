import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  FileText,
  Eye,
  AlertTriangle,  // â† ADD THIS
  AlertCircle     // â† Make sure this is here too
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function SubmissionsReview() {
  const { userDepartment, currentUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!userDepartment) return;

    // Query all tasks for this department that have been submitted (pending review or resolved)
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('department', '==', userDepartment),
      where('status', 'in', ['pending', 'approved', 'rejected'])
    );

    const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
      const submissionsList = [];

      for (const taskDoc of snapshot.docs) {
        const taskData = { id: taskDoc.id, ...taskDoc.data() };

        if (taskData.submissionId) {
          try {
            const subDoc = await getDoc(doc(db, 'submissions', taskData.submissionId));

            if (subDoc.exists()) {
              const subData = { id: subDoc.id, ...subDoc.data() };

              // Attach task info
              subData.taskInfo = taskData;
              // Ensure taskId is set on the object even if missing in DB
              subData.taskId = taskData.id;

              // CRITICAL FIX: Ensure checklistType is available. Fallback to task's type if missing in submission
              subData.checklistType = subData.checklistType || taskData.checklistType;

              // NORMALIZATION: Map internal config IDs to view IDs
              if (subData.checklistType === 'milling-process') subData.checklistType = 'milling';
              if (subData.checklistType === 'briquette-production') subData.checklistType = 'briquette';
              if (subData.checklistType === 'hub-collection-offloading') subData.checklistType = 'hubcollection';

              // CRITICAL FIX: Map _location to locationData (ChecklistEngine uses _location)
              subData.locationData = subData.locationData || subData._location;

              // CRITICAL FIX: Map root data to checklistState for Milling view compatibility
              // The view expects `checklistState['field']` but data is at root `['field']`
              if (!subData.checklistState) {
                subData.checklistState = subData;
              }

              // Fetch supervisor info if available
              if (subData.supervisorId) {
                const supervisorDoc = await getDoc(doc(db, 'users', subData.supervisorId));
                if (supervisorDoc.exists()) {
                  subData.supervisorInfo = supervisorDoc.data();
                }
              }

              submissionsList.push(subData);
            }
          } catch (err) {
            console.error("Error fetching submission details:", err);
          }
        }
      }

      // Sort by submission date (newest first)
      submissionsList.sort((a, b) => {
        const dateA = a.submittedAt?.toDate?.() || new Date(0);
        const dateB = b.submittedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setSubmissions(submissionsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userDepartment]);

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setIsDialogOpen(true);
    setFeedback('');
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;

    setActionLoading(true);
    try {
      // Update submission status
      await updateDoc(doc(db, 'submissions', selectedSubmission.id), {
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedAt: new Date(),
        feedback: feedback || 'Approved'
      });

      // Update task status
      if (selectedSubmission.taskId) {
        await updateDoc(doc(db, 'tasks', selectedSubmission.taskId), {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: currentUser.uid
        });
      }

      setSuccess('Submission approved successfully!');
      setIsDialogOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error approving submission:', err);
      alert('Failed to approve submission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;

    if (!feedback.trim()) {
      alert('Please provide feedback explaining why this is being rejected');
      return;
    }

    setActionLoading(true);
    try {
      // Update submission status
      await updateDoc(doc(db, 'submissions', selectedSubmission.id), {
        status: 'rejected',
        rejectedBy: currentUser.uid,
        rejectedAt: new Date(),
        feedback: feedback
      });

      // Update task status
      if (selectedSubmission.taskId) {
        await updateDoc(doc(db, 'tasks', selectedSubmission.taskId), {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: currentUser.uid
        });
      }

      setSuccess('Submission rejected. Supervisor will be notified.');
      setIsDialogOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error rejecting submission:', err);
      alert('Failed to reject submission');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return <Badge className="bg-green-500">Approved</Badge>;
    } else if (status === 'rejected') {
      return <Badge className="bg-red-500">Rejected</Badge>;
    } else {
      return <Badge className="bg-orange-500">Pending Review</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Submissions Review</h1>
        <p className="text-gray-600 mt-1">Review and approve completed checklists</p>
      </div>

      {/* Success Message */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Submissions Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="pending">
            Pending ({submissions.filter(s => !s.status || s.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({submissions.filter(s => s.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({submissions.filter(s => s.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <SubmissionList
            items={submissions.filter(s => !s.status || s.status === 'pending')}
            emptyMessage="No pending submissions to review"
            getStatusBadge={getStatusBadge}
            handleViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <SubmissionList
            items={submissions.filter(s => s.status === 'approved')}
            emptyMessage="No approved submissions"
            getStatusBadge={getStatusBadge}
            handleViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <SubmissionList
            items={submissions.filter(s => s.status === 'rejected')}
            emptyMessage="No rejected submissions"
            getStatusBadge={getStatusBadge}
            handleViewDetails={handleViewDetails}
          />
        </TabsContent>
      </Tabs>

      {/* Submission Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Review the complete checklist submission
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6 py-4">
              {/* Already Reviewed Alert */}
              {selectedSubmission.status && selectedSubmission.status !== 'pending' && (
                <Alert className={selectedSubmission.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                  <AlertDescription className={selectedSubmission.status === 'approved' ? 'text-green-800' : 'text-red-800'}>
                    This submission has been {selectedSubmission.status} on{' '}
                    {selectedSubmission.approvedAt?.toDate?.() || selectedSubmission.rejectedAt?.toDate?.()
                      ? new Date((selectedSubmission.approvedAt || selectedSubmission.rejectedAt).toDate()).toLocaleString()
                      : 'Unknown date'
                    }
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Supervisor</Label>
                  <p className="font-medium">{selectedSubmission.supervisorInfo?.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Checklist Type</Label>
                  <p className="font-medium capitalize">{selectedSubmission.checklistType}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Submitted</Label>
                  <p className="font-medium">
                    {selectedSubmission.submittedAt?.toDate?.()
                      ? new Date(selectedSubmission.submittedAt.toDate()).toLocaleString()
                      : 'Unknown'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Location Compliance</Label>
                  <p className="font-medium">
                    {selectedSubmission.locationData?.compliant ? (
                      <span className="text-green-600">âœ“ Verified</span>
                    ) : (
                      <span className="text-red-600">âœ— Not Verified</span>
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Milling Process Details */}
              {selectedSubmission.checklistType === 'milling' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 border-b pb-1 flex-1">Milling Process Data</h3>
                  </div>

                  {/* Step 1: Pre-Milling */}
                  <Card className="bg-gray-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Step 1: Pre-Milling Equipment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <span>Generator Check</span>
                          {selectedSubmission.checklistState?.['generator-check'] ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <span>Husk Receiver</span>
                          {selectedSubmission.checklistState?.['husk-receiver'] ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <span>White Polisher</span>
                          {selectedSubmission.checklistState?.['white-polisher'] ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                        </div>
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <span>Air Compressor</span>
                          {selectedSubmission.checklistState?.['air-compressor'] ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 2: Mill Activation */}
                  <Card className="bg-gray-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Step 2: Mill Activation & Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Paddy Weight</Label>
                          <p className="font-semibold text-lg">{selectedSubmission.checklistState?.['paddy-weight'] || '--'} kg</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Moisture Content</Label>
                          <p className="font-semibold text-lg">{selectedSubmission.checklistState?.['moisture-content'] || '--'}%</p>
                        </div>
                        <div className="bg-white p-3 rounded border col-span-2">
                          <Label className="text-gray-500 text-xs uppercase">Rice Type</Label>
                          <p className="font-semibold text-lg capitalize">{selectedSubmission.checklistState?.['rice-type'] || '--'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hourly Logs Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Hourly Logs ({selectedSubmission.hourlyLogs?.length || 0} hours)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedSubmission.hourlyLogs?.map((log, index) => (
                          <div key={index} className="border-l-4 border-primary pl-4">
                            <p className="font-medium mb-2">Hour {log.hour}</p>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Paddy Fed:</span> {log.paddyFed} kg
                              </div>
                              <div>
                                <span className="text-gray-600">Milled Rice:</span> {log.milledRice} kg
                              </div>
                              <div>
                                <span className="text-gray-600">Yield:</span> {log.yieldRatio}%
                              </div>
                            </div>
                            {log.notes && (
                              <p className="text-sm text-gray-600 mt-1">Notes: {log.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Shift Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-gray-600">Total Milled Rice</Label>
                          <p className="text-2xl font-bold text-primary">
                            {selectedSubmission.summary?.totalMilledRice} kg
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Final Yield Ratio</Label>
                          <p className="text-2xl font-bold text-green-600">
                            {selectedSubmission.summary?.finalYieldRatio}%
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Total Downtime</Label>
                          <p className="text-2xl font-bold text-red-600">
                            {selectedSubmission.summary?.totalDowntime} mins
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Separator />

              {/* Feedback Section */}
              {(!selectedSubmission.status || selectedSubmission.status === 'pending') && (
                <div className="space-y-3">
                  <Label>Feedback / Comments</Label>
                  <Textarea
                    placeholder="Add your comments or feedback (optional for approval, required for rejection)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {actionLoading ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={actionLoading}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {actionLoading ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Hub Collection & Offloading Details */}
              {selectedSubmission.checklistType === 'hubcollection' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Hub Collection & Offloading Data</h3>

                  {/* Part 1: Pre-Departure */}
                  <Card className="bg-gray-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Part 1: Pre-Departure Checks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Trip ID</Label>
                          <p className="font-semibold">{selectedSubmission['trip-id'] || '--'}</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Vehicle</Label>
                          <p className="font-semibold">{selectedSubmission['vehicle-reg'] || '--'}</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Driver</Label>
                          <p className="font-semibold">{selectedSubmission['driver-name'] || '--'}</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Destination Hub</Label>
                          <p className="font-semibold capitalize">
                            {selectedSubmission['destination-hub']?.replace('-', ' ') || '--'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Departure Time</Label>
                          <p className="font-semibold">{selectedSubmission['departure-time-hq'] || '--'}</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Workers</Label>
                          <p className="font-semibold">{selectedSubmission['workers-count'] || '--'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                        {[
                          { id: 'truck-booking-confirmed', label: 'Truck Booking Confirmed' },
                          { id: 'tyres-checked', label: 'Tyres Checked' },
                          { id: 'bolts-checked', label: 'Bolts Checked' },
                          { id: 'reg-plates-visible', label: 'Reg Plates Visible' },
                          { id: 'truck-refueled', label: 'Truck Refueled' },
                          { id: 'crew-confirmed', label: 'Crew Confirmed' }
                        ].map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span>{item.label}</span>
                            {selectedSubmission[item.id] ?
                              <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                              <XCircle className="w-5 h-5 text-red-600" />
                            }
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Part 2: Hub Transfer & Loading */}
                  <Card className="bg-gray-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Part 2: Hub Transfer, Loading & Closing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Arrival at Hub</Label>
                            <p className="font-bold text-lg">{selectedSubmission['arrival-time-hub'] || '--'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Bags Loaded</Label>
                            <p className="font-bold text-lg">{selectedSubmission['bags-loaded'] || '--'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Total Weight</Label>
                            <p className="font-bold text-lg">{selectedSubmission['total-weight'] || '--'} kg</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Loading Duration</Label>
                            <p className="font-semibold">
                              {selectedSubmission['loading-start-time'] && selectedSubmission['loading-end-time'] ?
                                `${selectedSubmission['loading-start-time']} - ${selectedSubmission['loading-end-time']}` : '--'}
                            </p>
                          </div>
                        </div>

                        {/* Moisture Tests */}
                        {selectedSubmission.moistureLogs?.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Moisture Test Results</Label>
                            <div className="grid grid-cols-1 gap-2">
                              {selectedSubmission.moistureLogs.map((log, index) => (
                                <div key={index} className="bg-white p-2 rounded border flex justify-between items-center">
                                  <div className="flex gap-4 text-sm">
                                    <span>Stack #{log.stackNumber}</span>
                                    <span>Bag #{log.bagNumber}</span>
                                    <span className="font-bold">{log.moistureLevel}%</span>
                                  </div>
                                  <Badge className={log.status?.toLowerCase() === 'pass' ? 'bg-green-500' : 'bg-red-500'}>
                                    {log.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Warehouse Closing */}
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <Label className="text-sm font-medium">Warehouse Closing</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            {[
                              { id: 'warehouse-locked', label: 'Warehouse Locked' },
                              { id: 'perimeter-inspected', label: 'Perimeter Inspected' },
                              { id: 'site-anomalies-reported', label: 'Anomalies Reported' }
                            ].map(item => (
                              <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border">
                                <span>{item.label}</span>
                                {selectedSubmission[item.id] ?
                                  <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                                  <XCircle className="w-5 h-5 text-red-600" />
                                }
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Part 3: Return Journey */}
                  <Card className="bg-gray-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Part 3: Return Journey</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Departure from Hub</Label>
                          <p className="font-bold text-lg">{selectedSubmission['departure-time-hub'] || '--'}</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Estimated Arrival</Label>
                          <p className="font-semibold">{selectedSubmission['estimated-arrival-hq'] || '--'}</p>
                        </div>
                      </div>
                      {selectedSubmission['journey-incidents'] && (
                        <Alert className="mt-3 bg-yellow-50 border-yellow-200">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <strong>Journey Incidents:</strong> {selectedSubmission['journey-incidents']}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Part 4: Offloading */}
                  <Card className="bg-gray-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Part 4: Offloading at HQ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Arrival at HQ</Label>
                            <p className="font-bold text-lg">{selectedSubmission['arrival-time-hq'] || '--'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Arrival Status</Label>
                            <Badge className={selectedSubmission['arrival-before-cutoff'] === 'before-1600' ? 'bg-green-500' : 'bg-orange-500'}>
                              {selectedSubmission['arrival-before-cutoff']?.replace('-', ' ') || '--'}
                            </Badge>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Bags Offloaded</Label>
                            <p className="font-bold text-lg">{selectedSubmission['bags-offloaded'] || '--'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Condition Score</Label>
                            <p className="font-bold text-lg">{selectedSubmission['condition-score'] || '--'}/10</p>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded border">
                          <Label className="text-gray-500 text-xs uppercase">Warehouse Location</Label>
                          <p className="font-medium">{selectedSubmission['warehouse-location'] || '--'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {[
                            { id: 'documents-verified', label: 'Documents Verified' },
                            { id: 'safety-briefing-conducted', label: 'Safety Briefing Conducted' },
                            { id: 'registered-odoo', label: 'Registered in Odoo' },
                            { id: 'warehouse-doors-locked', label: 'Warehouse Secured' }
                          ].map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border">
                              <span>{item.label}</span>
                              {selectedSubmission[item.id] ?
                                <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                                <XCircle className="w-5 h-5 text-red-600" />
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/*this section ends here mr*/}

              {/* Briquette Production Details */}
              {selectedSubmission.checklistType === 'briquette' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Briquette Production Data</h3>

                  {/* Calculate Summary Metrics on the fly if not present */}
                  {(() => {
                    const logs = selectedSubmission.hourlyLogs || [];
                    const totalOutput = logs.reduce((acc, log) => acc + (parseFloat(log.actualOutput) || 0), 0);
                    const totalHusk = logs.reduce((acc, log) => acc + (parseFloat(log.rawHuskUsed) || 0), 0);
                    const totalFuel = logs.reduce((acc, log) => acc + (parseFloat(log.fuelConsumption) || 0), 0);
                    const totalBags = logs.reduce((acc, log) => acc + (parseFloat(log.bagsProcessed) || 0), 0);

                    const huskEff = totalHusk > 0 ? (totalOutput / totalHusk).toFixed(2) : '0.00';
                    const fuelEff = totalFuel > 0 ? (totalOutput / totalFuel).toFixed(2) : '0.00';

                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <Card className="bg-slate-50">
                          <CardContent className="p-4">
                            <Label className="text-xs text-gray-500 uppercase">Total Output</Label>
                            <p className="text-2xl font-bold text-primary">{totalOutput} kg</p>
                            <p className="text-xs text-gray-400">({totalBags} bags)</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-slate-50">
                          <CardContent className="p-4">
                            <Label className="text-xs text-gray-500 uppercase">Husk Efficiency</Label>
                            <p className="text-xl font-bold text-green-600">{huskEff}</p>
                            <p className="text-xs text-gray-400">Ratio Output/Input</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-slate-50">
                          <CardContent className="p-4">
                            <Label className="text-xs text-gray-500 uppercase">Fuel Efficiency</Label>
                            <p className="text-xl font-bold text-green-600">{fuelEff} kg/L</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-slate-50">
                          <CardContent className="p-4">
                            <Label className="text-xs text-gray-500 uppercase">Input Usage</Label>
                            <p className="text-sm font-medium">Husk: {totalHusk} kg</p>
                            <p className="text-sm font-medium">Fuel: {totalFuel} L</p>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}

                  {/* Pre-Op and Raw Material Checks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Pre-Operation Checks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {[
                            { id: 'safety-ppe', label: 'PPE Check' },
                            { id: 'fire-extinguisher', label: 'Fire Safety' },
                            { id: 'machine-clean', label: 'Machine Cleanliness' },
                            { id: 'no-naked-wires', label: 'Electrical Safety' },
                            { id: 'calibrated', label: 'Calibration' }
                          ].map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border">
                              <span>{item.label}</span>
                              {selectedSubmission[item.id] ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                            </div>
                          ))}
                          <div className="bg-white p-2 rounded border mt-2">
                            <Label className="text-gray-500 text-xs uppercase">Last Service</Label>
                            <p className="font-medium">
                              {selectedSubmission['maintenance-date'] ? new Date(selectedSubmission['maintenance-date']).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Raw Material Checks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Husk Moisture</Label>
                            <p className="font-bold text-lg">{selectedSubmission['husk-moisture'] || '--'}%</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Husk Weight</Label>
                            <p className="font-bold text-lg">{selectedSubmission['husk-weight'] || '--'} kg</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <Label className="text-gray-500 text-xs uppercase">Consistency</Label>
                            <p className="font-medium capitalize">{selectedSubmission['husk-consistency'] || '--'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Hourly Logs Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Hourly Production Logs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedSubmission.hourlyLogs?.map((log, index) => (
                          <div key={index} className="border-l-4 border-primary pl-4 py-2 bg-gray-50 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-md">{(log.hour || log.scheduledTime)}</p>
                              {log._timestamp && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {new Date(log._timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white p-2 rounded border">
                              <div>
                                <span className="text-gray-500 text-xs block uppercase">Output</span>
                                <span className="font-bold text-lg">{log.actualOutput || 0} kg</span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs block uppercase">Bags</span>
                                <span className="font-medium">{log.bagsProcessed || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs block uppercase">Husk Used</span>
                                <span className="font-medium">{log.rawHuskUsed || 0} kg</span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs block uppercase">Fuel</span>
                                <span className="font-medium">{log.fuelConsumption || 0} L</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-500 text-xs block uppercase">Notes</span>
                                <span className="text-gray-700 italic">{log.notes || 'No notes'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quality Control */}
                  {selectedSubmission.qualityLogs?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Quality Control Checks
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedSubmission.qualityLogs?.map((log, index) => (
                            <div key={index} className="border p-3 rounded bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">Check #{log.checkNumber}</Badge>
                                {log._timestamp && <span className="text-xs text-gray-400">{new Date(log._timestamp).toLocaleTimeString()}</span>}
                              </div>
                              <div className="flex gap-6 text-sm">
                                <div>
                                  <span className="text-gray-500 text-xs block">Ash Content</span>
                                  <span className="font-bold">{log.ashContent}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 text-xs block">Calorific</span>
                                  <span className="font-bold">{log.calorificValue}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 text-xs block">Density</span>
                                  <span className="font-medium">{log.densityCheck}</span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                Signed by: {log.supervisorSignOff || 'Pending'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Already Reviewed */}
                  {
                    selectedSubmission.status && selectedSubmission.status !== 'pending' && (
                      <Alert className={selectedSubmission.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                        <AlertDescription className={selectedSubmission.status === 'approved' ? 'text-green-800' : 'text-red-800'}>
                          This submission has been {selectedSubmission.status} on{' '}
                          {selectedSubmission.approvedAt?.toDate?.() || selectedSubmission.rejectedAt?.toDate?.()
                            ? new Date((selectedSubmission.approvedAt || selectedSubmission.rejectedAt).toDate()).toLocaleString()
                            : 'Unknown date'
                          }
                        </AlertDescription>
                      </Alert>
                    )
                  }
                </div>
              )}
            </div>
          )
          }
        </DialogContent >
      </Dialog >
    </div >
  );
}

export const SubmissionList = ({ items, emptyMessage, getStatusBadge, handleViewDetails }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions</CardTitle>
        <CardDescription>Review completed checklists</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <FileText className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions</h3>
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((submission) => (
              <div key={submission.id} className="border-2 rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="p-6 pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <h3 className="text-lg font-semibold">
                          {submission.taskInfo?.checklistName || 'Checklist Submission'}
                        </h3>
                        {getStatusBadge(submission.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{submission.supervisorInfo?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            Submitted{' '}
                            {submission.submittedAt?.toDate?.()
                              ? new Date(submission.submittedAt.toDate()).toLocaleString()
                              : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="capitalize">{submission.taskInfo?.shift} Shift</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {submission.locationData?.compliant ? (
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-white hover:bg-green-500/80">
                              <MapPin className="w-3 h-3 mr-1" />
                              Location Verified
                            </div>
                          ) : (
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-red-500 text-white hover:bg-red-500/80">
                              <MapPin className="w-3 h-3 mr-1" />
                              Location Issue
                            </div>
                          )}
                        </div>
                      </div>

                      {submission.feedback && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <p className="font-medium text-gray-700">Feedback:</p>
                          <p className="text-gray-600">{submission.feedback}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                        onClick={() => handleViewDetails(submission)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
