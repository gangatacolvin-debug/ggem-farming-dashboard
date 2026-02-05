import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Calendar,
  TrendingUp
} from 'lucide-react';

export default function MySubmissions() {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showResubmitDialog, setShowResubmitDialog] = useState(false);
  const [resubmitNote, setResubmitNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('supervisorId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by submission date (newest first)
      subs.sort((a, b) => {
        const dateA = a.submittedAt?.toDate?.() || new Date(0);
        const dateB = b.submittedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setSubmissions(subs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500"><Clock className="w-3 h-3 mr-1" />Waiting for Approval</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setShowDetailDialog(true);
  };

const handleResubmit = async () => {
  if (!selectedSubmission || !resubmitNote.trim()) {
    alert('Please add a note explaining the resubmission');
    return;
  }

  try {
    // Update submission status
    await updateDoc(doc(db, 'submissions', selectedSubmission.id), {
      status: 'pending',
      resubmittedAt: new Date(),
      resubmitNote: resubmitNote,
      previousRejection: {
        rejectedAt: selectedSubmission.rejectedAt,
        rejectedBy: selectedSubmission.rejectedBy,
        feedback: selectedSubmission.feedback
      }
    });

    // Update task status back to pending
    if (selectedSubmission.taskId) {
      await updateDoc(doc(db, 'tasks', selectedSubmission.taskId), {
        status: 'pending',
        resubmittedAt: new Date()
      });
    }

    alert('Batch resubmitted successfully!');
    setShowResubmitDialog(false);
    setShowDetailDialog(false);
    setResubmitNote('');
  } catch (err) {
    console.error('Error resubmitting:', err);
    alert('Failed to resubmit batch');
  }
};;

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
        <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-600 mt-1">Track the status of your submitted batches</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Waiting for Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {submissions.filter(s => s.status === 'pending').length}
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
          <CardDescription>Your batch submission history</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Submissions Yet
              </h3>
              <p className="text-gray-500">
                Complete a checklist to create your first batch submission
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <Card key={submission.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Batch Header */}
                        <div className="flex items-center space-x-2 mb-3">
                          <h3 className="text-lg font-semibold">
                            Batch #{submission.batchId}
                          </h3>
                          {getStatusBadge(submission.status)}
                        </div>

                        {/* Batch Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Submitted {submission.submittedAt?.toDate?.() 
                                ? new Date(submission.submittedAt.toDate()).toLocaleDateString()
                                : 'Unknown'
                              }
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="capitalize">
                              {submission.checklistType} - {submission.shiftInfo?.type} Shift
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-gray-600">
                            <TrendingUp className="w-4 h-4" />
                            <span>
                              {submission.summary?.totalOutput} kg / {submission.targets?.adjusted} kg 
                              ({submission.targets?.achievementPercent}%)
                            </span>
                          </div>

                          {submission.shiftInfo?.endedEarly && (
                            <div className="text-orange-600 text-sm">
                              ⚠️ Ended Early: {submission.shiftInfo?.endReason}
                            </div>
                          )}
                        </div>

                        {/* Approval/Rejection Info */}
                        {submission.status === 'approved' && (
                          <Alert className="mt-3 bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                              <strong>Approved</strong> on {submission.approvedAt?.toDate?.() 
                                ? new Date(submission.approvedAt.toDate()).toLocaleString()
                                : 'Unknown'
                              }
                              {submission.feedback && (
                                <p className="mt-1">Manager's feedback: "{submission.feedback}"</p>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        {submission.status === 'rejected' && (
                          <Alert className="mt-3 bg-red-50 border-red-200">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              <strong>Rejected</strong> on {submission.rejectedAt?.toDate?.() 
                                ? new Date(submission.rejectedAt.toDate()).toLocaleString()
                                : 'Unknown'
                              }
                              <p className="mt-1"><strong>Reason:</strong> {submission.feedback}</p>
                            </AlertDescription>
                          </Alert>
                        )}

                        {submission.status === 'pending' && (
                          <Alert className="mt-3 bg-orange-50 border-orange-200">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              Waiting for manager approval
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="ml-4 flex flex-col space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(submission)}
                        >
                          View Details
                        </Button>
                        
                        {submission.status === 'rejected' && (
                          <Button 
                            size="sm"
                            className="bg-primary"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowResubmitDialog(true);
                            }}
                          >
                            Resubmit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Details - {selectedSubmission?.batchId}</DialogTitle>
            <DialogDescription>
              Complete batch information and status
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Status</h4>
                {getStatusBadge(selectedSubmission.status)}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Production</p>
                  <p className="text-lg font-bold">{selectedSubmission.summary?.totalOutput} kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Target</p>
                  <p className="text-lg font-bold">{selectedSubmission.targets?.adjusted} kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Achievement</p>
                  <p className="text-lg font-bold text-primary">{selectedSubmission.targets?.achievementPercent}%</p>
                </div>
              </div>

              {/* Feedback if exists */}
              {selectedSubmission.feedback && (
                <Alert>
                  <AlertDescription>
                    <strong>Manager Feedback:</strong> {selectedSubmission.feedback}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resubmit Dialog */}
      <Dialog open={showResubmitDialog} onOpenChange={setShowResubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resubmit Batch</DialogTitle>
            <DialogDescription>
              Add a note explaining the resubmission or corrections made
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedSubmission?.feedback && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  <strong>Previous Rejection Reason:</strong><br />
                  {selectedSubmission.feedback}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="resubmitNote">Resubmission Note *</Label>
              <Textarea
                id="resubmitNote"
                placeholder="Explain what was corrected or why this should be reconsidered..."
                value={resubmitNote}
                onChange={(e) => setResubmitNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResubmit} className="bg-primary">
              Resubmit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}