import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ClipboardCheck, Loader2 } from 'lucide-react';

export default function ManagerScorecard() {
    const { currentUser, userDepartment } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    const initialFormState = {
        staffId: '',
        staffName: '',
        role: '',
        reportingPeriod: 'Week',
        location: '',
        daysScheduled: '',
        daysWorked: '',
        absenceDays: '',
        punctuality: '',
        availability: '',
        phoneSurveys: '',
        farmersRegistered: '',
        followUpCalls: '',
        tasksAssigned: '',
        tasksCompleted: '',
        accuracyScore: '',
        recordsReturnedScore: '',
        completenessScore: '',
        systemUseScore: '',
        professionalCommScore: '',
        clarityScore: '',
        patienceScore: '',
        timelySubmissionScore: '',
        completionDeadlinesScore: '',
        responsivenessScore: '',
        overallConductScore: '',
        teamCooperationScore: '',
        reliabilityScore: '',
        initiativeScore: '',
        farmerFeedbackScore: '',
        meetingParticipationScore: '',
        supervisorComments: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                // Fetch users in the same department to list them as staff options
                const q = query(
                    collection(db, 'users'),
                    where('department', '==', userDepartment)
                );
                const querySnapshot = await getDocs(q);
                const members = [];
                querySnapshot.forEach((doc) => {
                    members.push({ id: doc.id, ...doc.data() });
                });
                setTeamMembers(members);
            } catch (error) {
                console.error("Error fetching team members:", error);
                toast.error("Failed to load staff list");
            } finally {
                setLoadingMembers(false);
            }
        };

        fetchTeamMembers();
    }, [userDepartment]);

    // Handle Staff Selection
    const handleStaffChange = (staffId) => {
        const selectedMember = teamMembers.find(m => m.id === staffId);
        setFormData(prev => ({
            ...prev,
            staffId: staffId,
            staffName: selectedMember ? selectedMember.name : ''
        }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            
            // Auto-calculate absence days if daysScheduled and daysWorked change
            if (field === 'daysScheduled' || field === 'daysWorked') {
                const scheduled = parseInt(newData.daysScheduled) || 0;
                const worked = parseInt(newData.daysWorked) || 0;
                newData.absenceDays = Math.max(0, scheduled - worked).toString();
            }
            
            return newData;
        });
    };

    // Calculate overall percentage based on /5 score fields
    const scoreFields = [
        'punctuality', 'availability', 'accuracyScore', 'recordsReturnedScore',
        'completenessScore', 'systemUseScore', 'professionalCommScore', 'clarityScore',
        'patienceScore', 'timelySubmissionScore', 'completionDeadlinesScore',
        'responsivenessScore', 'overallConductScore', 'teamCooperationScore',
        'reliabilityScore', 'initiativeScore', 'farmerFeedbackScore', 'meetingParticipationScore'
    ];

    const calculateTotalScore = () => {
        let total = 0;
        let answered = 0;
        scoreFields.forEach(field => {
            if (formData[field]) {
                total += parseInt(formData[field], 10);
                answered += 1;
            }
        });
        
        if (answered === 0) return 0;
        
        const maxPossible = answered * 5;
        return Math.round((total / maxPossible) * 100);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        
        if (!formData.staffId) {
            toast.error("Please select a staff member");
            return;
        }

        setSubmitting(true);
        try {
            const overallScore = calculateTotalScore();
            
            const scorecardData = {
                ...formData,
                supervisorId: currentUser?.uid || 'Unknown',
                supervisorName: currentUser?.displayName || currentUser?.email || 'Unknown',
                managerDepartment: userDepartment,
                evaluationDate: formData.evaluationDate || new Date().toISOString(),
                createdAt: serverTimestamp(),
                overallPerformanceScore: overallScore
            };

            await addDoc(collection(db, 'scorecards'), scorecardData);
            toast.success("Scorecard submitted successfully!");
            setSuccessMessage(`Scorecard for ${formData.staffName} was successfully submitted and saved.`);
            setFormData(initialFormState);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } catch (error) {
            console.error("Error submitting scorecard:", error);
            toast.error("Failed to submit scorecard");
        } finally {
            setSubmitting(false);
        }
    };

    // Score dropdown component for /5 fields
    const ScoreSelect = ({ label, fieldName }) => (
        <div className="space-y-2">
            <Label>{label} <span className="text-gray-500 text-xs">(/5)</span></Label>
            <Select 
                value={formData[fieldName]} 
                onValueChange={(val) => handleInputChange(fieldName, val)}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Score (1-5)" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">1 - Poor</SelectItem>
                    <SelectItem value="2">2 - Needs Improvement</SelectItem>
                    <SelectItem value="3">3 - Satisfactory</SelectItem>
                    <SelectItem value="4">4 - Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <ClipboardCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Data Collectors Performance Scorecard</h1>
                    <p className="text-gray-600 mt-1">Evaluate and track performance metrics for your team</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-lg text-slate-800">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Staff Name *</Label>
                            <Select 
                                value={formData.staffId} 
                                onValueChange={handleStaffChange}
                                disabled={loadingMembers}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingMembers ? "Loading..." : "Select Staff Member"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {teamMembers.map(member => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.name || member.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select 
                                value={formData.role} 
                                onValueChange={(val) => handleInputChange('role', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Data Collector">Data Collector</SelectItem>
                                    <SelectItem value="Call Survey Agent">Call Survey Agent</SelectItem>
                                    <SelectItem value="Call Centre Agent">Call Centre Agent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Supervisor Name</Label>
                            <Input 
                                disabled 
                                value={currentUser?.displayName || currentUser?.email || 'Unknown'} 
                                className="bg-gray-50 text-gray-600 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Reporting Period</Label>
                            <Select 
                                value={formData.reportingPeriod} 
                                onValueChange={(val) => handleInputChange('reportingPeriod', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Week">Week</SelectItem>
                                    <SelectItem value="Month">Month</SelectItem>
                                    <SelectItem value="Quarter">Quarter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Work Location / Team / Cluster</Label>
                            <Input 
                                placeholder="e.g., Central Cluster A" 
                                value={formData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Date of Evaluation</Label>
                            <Input 
                                type="date"
                                value={formData.evaluationDate || ''}
                                onChange={(e) => handleInputChange('evaluationDate', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance & Work Presence */}
                <Card>
                    <CardHeader className="bg-orange-50 border-b">
                        <CardTitle className="text-lg text-orange-800">Attendance & Work Presence</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Days scheduled to work</Label>
                            <Input 
                                type="number" 
                                min="0"
                                value={formData.daysScheduled}
                                onChange={(e) => handleInputChange('daysScheduled', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Days actually worked</Label>
                            <Input 
                                type="number" 
                                min="0"
                                value={formData.daysWorked}
                                onChange={(e) => handleInputChange('daysWorked', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Absence days (Auto-calculated)</Label>
                            <Input 
                                type="number" 
                                disabled
                                className="bg-gray-50 text-gray-600"
                                value={formData.absenceDays}
                            />
                        </div>
                        <ScoreSelect label="Punctuality (on-time start)" fieldName="punctuality" />
                        <ScoreSelect label="Availability during working hours" fieldName="availability" />
                    </CardContent>
                </Card>

                {/* Productivity */}
                <Card>
                    <CardHeader className="bg-green-50 border-b">
                        <CardTitle className="text-lg text-green-800">Productivity</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label>Phone surveys completed</Label>
                            <Input 
                                type="number" min="0"
                                value={formData.phoneSurveys}
                                onChange={(e) => handleInputChange('phoneSurveys', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Farmers registered</Label>
                            <Input 
                                type="number" min="0"
                                value={formData.farmersRegistered}
                                onChange={(e) => handleInputChange('farmersRegistered', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Follow-up calls completed</Label>
                            <Input 
                                type="number" min="0"
                                value={formData.followUpCalls}
                                onChange={(e) => handleInputChange('followUpCalls', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>Assigned</Label>
                                <Input 
                                    type="number" min="0"
                                    value={formData.tasksAssigned}
                                    onChange={(e) => handleInputChange('tasksAssigned', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Completed</Label>
                                <Input 
                                    type="number" min="0"
                                    value={formData.tasksCompleted}
                                    onChange={(e) => handleInputChange('tasksCompleted', e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Quality & Communication */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="bg-blue-50 border-b">
                            <CardTitle className="text-lg text-blue-800">Data Quality</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <ScoreSelect label="Accuracy of data captured" fieldName="accuracyScore" />
                            <ScoreSelect label="Records returned for correction" fieldName="recordsReturnedScore" />
                            <ScoreSelect label="Completeness of survey forms" fieldName="completenessScore" />
                            <ScoreSelect label="Proper use of the system/app" fieldName="systemUseScore" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="bg-purple-50 border-b">
                            <CardTitle className="text-lg text-purple-800">Communication</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <ScoreSelect label="Professional communication with farmers" fieldName="professionalCommScore" />
                            <ScoreSelect label="Clarity explaining questions/info" fieldName="clarityScore" />
                            <ScoreSelect label="Patience and respect during calls" fieldName="patienceScore" />
                        </CardContent>
                    </Card>
                </div>

                {/* Timeliness & Conduct */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="bg-yellow-50 border-b">
                            <CardTitle className="text-lg text-yellow-800">Timeliness</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <ScoreSelect label="Timely submission of reports" fieldName="timelySubmissionScore" />
                            <ScoreSelect label="Completion of tasks within deadlines" fieldName="completionDeadlinesScore" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="bg-indigo-50 border-b">
                            <CardTitle className="text-lg text-indigo-800">Conduct & Teamwork</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <ScoreSelect label="Responsiveness to supervisor instructions" fieldName="responsivenessScore" />
                            <ScoreSelect label="Overall conduct rating from supervisor" fieldName="overallConductScore" />
                            <ScoreSelect label="Team cooperation" fieldName="teamCooperationScore" />
                            <ScoreSelect label="Reliability and accountability" fieldName="reliabilityScore" />
                            <ScoreSelect label="Initiative in solving problems" fieldName="initiativeScore" />
                        </CardContent>
                    </Card>
                </div>

                {/* Feedback & Rating */}
                <Card>
                    <CardHeader className="bg-rose-50 border-b">
                        <CardTitle className="text-lg text-rose-800">Feedback & Overall Rating</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <ScoreSelect label="Farmer feedback or complaints linked to agent" fieldName="farmerFeedbackScore" />
                            <ScoreSelect label="Participation in meetings or check-ins" fieldName="meetingParticipationScore" />
                        </div>
                        <div className="space-y-2 border-l pl-6">
                           <div className="mb-4">
                               <p className="text-sm font-medium text-gray-500 mb-1">Live Score Calculation</p>
                               <div className="text-4xl font-bold text-primary">
                                   {calculateTotalScore()}%
                               </div>
                           </div>
                           <Label>Supervisor comments</Label>
                           <Textarea 
                               className="min-h-[120px]"
                               placeholder="Add your overall comments and feedback here..."
                               value={formData.supervisorComments}
                               onChange={(e) => handleInputChange('supervisorComments', e.target.value)}
                           />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 border-t flex flex-col items-center justify-center p-6 space-y-4">
                        <Button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full md:w-auto min-w-[200px]"
                        >
                            {submitting ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                            ) : (
                                "Submit Scorecard"
                            )}
                        </Button>
                        {successMessage && (
                            <div className="w-full md:w-3/4 p-4 mt-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center flex items-center justify-center space-x-2">
                                <ClipboardCheck className="w-5 h-5 text-green-600" />
                                <span>{successMessage}</span>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
