export const outreachEngagementChecklistConfig = {
    id: 'outreach-engagement',
    title: 'Outreach & Engagement Checklist',
    description: 'Farmer & Community Outreach and Engagement (Weekly)',
    sections: [
        {
            id: 'header',
            title: 'Header Information',
            fields: [
                { id: 'week-of', type: 'date', label: 'Week of', placeholder: 'Select week start date', required: true },
                { id: 'zone-district', type: 'text', label: 'Zone / District', placeholder: 'Enter Zone or District', required: true },
                { id: 'team-responsible', type: 'text', label: 'Team Responsible', placeholder: 'e.g., Team A', required: true },
                { id: 'supervisor-name-header', type: 'text', label: 'Supervisor Name', autoPopulate: 'supervisorName', required: true },
                { id: 'line-manager', type: 'text', label: 'Line Manager', placeholder: 'Enter Line Manager Name' },
                { id: 'date-of-evaluation', type: 'date', label: 'Date of Evaluation', autoPopulate: 'date', required: true }
            ]
        },
        {
            id: 'pre-engagement',
            title: 'Section 1 — Pre-Engagement Preparation',
            fields: [
                { id: 'weekly-plan-reviewed', type: 'checkbox', label: 'Weekly outreach plan reviewed and target zones confirmed' },
                { id: 'meetings-confirmed', type: 'checkbox', label: 'Meeting schedules confirmed with aggregators, CBOs, and local leaders' },
                { id: 'materials-prepared', type: 'checkbox', label: 'Communication materials, flyers, and demonstration kits prepared' },
                { id: 'call-centre-aligned', type: 'checkbox', label: 'Call-centre coordinated — message alignment confirmed' },
                { id: 'fmt-briefed', type: 'checkbox', label: 'All FMTs briefed on engagement objectives' },
                { id: 'logistics-confirmed', type: 'checkbox', label: 'Transport, fuel, and logistics confirmed' },
                { id: 'safety-inspected', type: 'checkbox', label: 'Safety equipment inspected and emergency protocols confirmed' },
                { id: 'pre-engagement-timestamp', type: 'text', label: 'Timestamp (Auto)', autoPopulate: 'timestamp', required: true }
            ]
        },
        {
            id: 'execution',
            title: 'Section 2 — Community Engagement Execution',
            fields: [
                { id: 'introductions-conducted', type: 'checkbox', label: 'Introductions conducted with local leaders before meetings' },
                { id: 'sessions-facilitated', type: 'checkbox', label: 'Farmer or community sessions facilitated' },
                { id: 'topic-covered', type: 'textarea', label: 'Topic Covered', placeholder: 'Enter the main topics covered during the session', required: true },
                { id: 'messages-presented', type: 'checkbox', label: 'GGEM messages and offers presented clearly and consistently' },
                { id: 'samples-distributed', type: 'checkbox', label: 'Sample products distributed or demonstrated where applicable' },
                { id: 'attendance-collected', type: 'checkbox', label: 'Attendance and contact information collected' },
                { id: 'questions-recorded', type: 'textarea', label: 'Participant Questions & Feedback', placeholder: 'Record questions, concerns, and feedback from participants' },
                { id: 'photos-videos-captured', type: 'text', label: 'Photos/Videos Links (Optional)', placeholder: 'Paste links to captured media' },
                { id: 'tracker-updated', type: 'checkbox', label: 'Engagement tracker updated after each session' },
                { id: 'sessions-held-count', type: 'number', label: 'Number of sessions held this week', placeholder: 'e.g., 5', required: true },
                { id: 'participants-reached', type: 'number', label: 'Number of participants reached', placeholder: 'e.g., 150', required: true },
                { id: 'execution-timestamp', type: 'text', label: 'Timestamp (Auto)', autoPopulate: 'timestamp', required: true }
            ]
        },
        {
            id: 'data-recording',
            title: 'Section 3 — Data & Feedback Recording',
            fields: [
                { id: 'sheets-uploaded', type: 'checkbox', label: 'Attendance sheets and feedback summaries uploaded to CRM' },
                { id: 'recurring-issues', type: 'textarea', label: 'Recurring Issues / FAQs', placeholder: 'Note frequently asked questions or recurring issues' },
                { id: 'feedback-shared', type: 'checkbox', label: 'Feedback shared with call-centre and content team' },
                { id: 'data-timestamp', type: 'text', label: 'Timestamp (Auto)', autoPopulate: 'timestamp', required: true }
            ]
        },
        {
            id: 'post-review',
            title: 'Section 4 — Post-Engagement Review',
            fields: [
                { id: 'report-submitted', type: 'checkbox', label: 'Engagement report submitted by end of week' },
                { id: 'success-stories', type: 'textarea', label: 'Success Stories / Best Practices', placeholder: 'Highlight any success stories from the field' },
                { id: 'debrief-attended', type: 'checkbox', label: 'Weekly team debrief attended' },
                { id: 'improvements', type: 'textarea', label: 'Improvements Recommended', placeholder: 'Suggest improvements for next week' },
                { id: 'review-timestamp', type: 'text', label: 'Timestamp (Auto)', autoPopulate: 'timestamp', required: true }
            ]
        },
        {
            id: 'sign-off',
            title: 'Supervisor Sign-off',
            fields: [
                { id: 'supervisor-name', type: 'text', label: 'Supervisor Name', autoPopulate: 'supervisorName', required: true },
                { id: 'sign-off-date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'supervisor-signature', type: 'text', label: 'Type Name to Sign', placeholder: 'Enter full name as signature', required: true }
            ]
        },
        {
            id: 'summary',
            title: 'Summary & KPIs',
            fields: [
                { id: 'women-participants', type: 'number', label: '% Women Participants', placeholder: 'e.g., 45' },
                { id: 'cbos-engaged', type: 'number', label: 'CBOs Engaged', placeholder: 'e.g., 2' },
                { id: 'new-groups', type: 'number', label: 'New Farmer Groups Identified', placeholder: 'e.g., 3' },
                { id: 'feedback-reports', type: 'checkbox', label: 'Feedback Reports Submitted' },
                { id: 'media-uploaded', type: 'checkbox', label: 'Photos / Videos Uploaded' }
            ]
        }
    ]
};
