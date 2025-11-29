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
  Eye
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SubmissionsReview() {
  const { userDepartment } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!userDepartment) return;

    // Query all submissions for this department
    const submissionsQuery = query(
      collection(db, 'submissions')
    );

    const unsubscribe = onSnapshot(submissionsQuery, async (snapshot) => {
      const submissionsData = [];
      
      for (const subDoc of snapshot.docs) {
        const subData = { id: subDoc.id, ...subDoc.data() };
        
        // Fetch task details
        if (subData.taskId) {
          const taskDoc = await getDoc(doc(db, 'tasks', subData.taskId));
          if (taskDoc.exists()) {
            const taskData = taskDoc.data();
            
            // Only include submissions from our department
            if (taskData.department === userDepartment) {
              subData.taskInfo = taskData;
              
              // Fetch supervisor info
              if (subData.supervisorId) {
                const supervisorDoc = await getDoc(doc(db, 'users', subData.supervisorId));
                if (supervisorDoc.exists()) {
                  subData.supervisorInfo = supervisorDoc.data();
                }
              }
              
              submissionsData.push(subData);
            }
          }
        }
      }

      // Sort by submission date (newest first)
      submissionsData.sort((a, b) => {
        const dateA = a.submittedAt?.toDate?.() || new Date(0);
        const dateB = b.submittedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setSubmissions(submissionsData);
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
      await updateDoc(doc(db, 'submissions', selectedSubmission.id), {
        status: 'approved',
        approvedBy: userDepartment, // You can store manager's user ID here
        approvedAt: new Date(),
        feedback: feedback || 'Approved'
      });

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
      await updateDoc(doc(db, 'submissions', selectedSubmission.id), {
        status: 'rejected',
        rejectedBy: userDepartment,
        rejectedAt: new Date(),
        feedback: feedback
      });

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {submissions.filter(s => !s.status || s.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {submissions.filter(s => s.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>Review completed checklists from supervisors</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Submissions Yet
              </h3>
              <p className="text-gray-500">
                Submissions will appear here when supervisors complete their checklists
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <Card key={submission.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Submission Header */}
                        <div className="flex items-center space-x-2 mb-3">
                          <h3 className="text-lg font-semibold">
                            {submission.taskInfo?.checklistName || 'Checklist Submission'}
                          </h3>
                          {getStatusBadge(submission.status)}
                        </div>

                        {/* Submission Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{submission.supervisorInfo?.name || 'Unknown'}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              Submitted {submission.submittedAt?.toDate?.() 
                                ? new Date(submission.submittedAt.toDate()).toLocaleString()
                                : 'Unknown'
                              }
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="capitalize">
                              {submission.taskInfo?.shift} Shift
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {submission.locationData?.compliant ? (
                              <Badge className="bg-green-500">
                                <MapPin className="w-3 h-3 mr-1" />
                                Location Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500">
                                <MapPin className="w-3 h-3 mr-1" />
                                Location Issue
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Feedback if exists */}
                        {submission.feedback && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                            <p className="font-medium text-gray-700">Feedback:</p>
                            <p className="text-gray-600">{submission.feedback}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(submission)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              {/* Basic Info */}
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
                      <span className="text-green-600">✓ Verified</span>
                    ) : (
                      <span className="text-red-600">✗ Not Verified</span>
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Milling Process Details */}
              {selectedSubmission.checklistType === 'milling' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Milling Process Data</h3>
                  
                  {/* Step 1 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Pre-Milling Equipment Setup</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          {selectedSubmission.step1?.generatorCheck ? <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" /> : <XCircle className="w-4 h-4 text-red-600 mr-2" />}
                          <span>Generator check</span>
                        </div>
                        <div className="flex items-center">
                          {selectedSubmission.step1?.huskReceiver ? <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" /> : <XCircle className="w-4 h-4 text-red-600 mr-2" />}
                          <span>Husk Receiver</span>
                        </div>
                        <div className="flex items-center">
                          {selectedSubmission.step1?.whitePolisher ? <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" /> : <XCircle className="w-4 h-4 text-red-600 mr-2" />}
                          <span>White Polisher</span>
                        </div>
                        <div className="flex items-center">
                          {selectedSubmission.step1?.airCompressor ? <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" /> : <XCircle className="w-4 h-4 text-red-600 mr-2" />}
                          <span>Air Compressor</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 2 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Mill Activation & Paddy Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label className="text-gray-600">Paddy Weight</Label>
                          <p className="font-medium">{selectedSubmission.step2?.paddyWeight} kg</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Moisture Test</Label>
                          <p className="font-medium">{selectedSubmission.step2?.moistureTest}%</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Rice Type</Label>
                          <p className="font-medium capitalize">{selectedSubmission.step2?.riceType}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Quality Check</Label>
                          <p className="font-medium">
                            {selectedSubmission.step2?.qualityCheck ? '✓ Passed' : '✗ Failed'}
                          </p>
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

              {/* Already Reviewed */}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}