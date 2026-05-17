import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import LiveTaskDetailView from '@/features/checklists/components/LiveTaskDetailView';

export default function ManagerTaskDetail() {
    const { taskId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>
            <LiveTaskDetailView taskId={taskId} />
        </div>
    );
}
