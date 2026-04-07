/**
 * Field Monitoring & QA - Weekly Checklist
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const fieldMonitoringQAChecklistConfig = {
    id: 'field-monitoring-qa',
    title: 'Field Monitoring & QA Checklist',
    description: 'Weekly monitoring, verification and quality control workflow',

    sections: [
        {
            id: 'header',
            title: 'Header Information',
            description: 'Record basic information before starting',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                { id: 'checklist-id', type: 'text', label: 'Checklist ID', placeholder: 'Auto-generated', readOnly: true },
                { id: 'week-of', type: 'date', label: 'Week of', required: true },
                { id: 'zone-district', type: 'text', label: 'Zone / District', placeholder: 'Enter zone or district', required: true },
                { id: 'team-responsible', type: 'text', label: 'Team Responsible', placeholder: 'Enter team name', required: true },
                { id: 'supervisor-name', type: 'text', label: 'Supervisor Name', autoPopulate: 'supervisorName', required: true },
                { id: 'line-manager', type: 'text', label: 'Line Manager', placeholder: 'Enter line manager name', required: true },
                { id: 'date-of-evaluation', type: 'date', label: 'Date of Evaluation', autoPopulate: 'date', required: true }
            ]
        },

        {
            id: 'pre-monitoring-preparation',
            title: 'Section 1 — Pre-Monitoring Preparation',
            description: 'Confirm schedule, tools, and logistics before heading to the field',
            estimatedDuration: 15,
            requiresLocation: false,
            fields: [
                { id: 'previous-reports-reviewed', type: 'checkbox', label: 'Previous week\'s reports and flagged issues reviewed' },
                { id: 'monitoring-schedule-confirmed', type: 'checkbox', label: 'Monitoring schedule and site list confirmed' },
                { id: 'monitoring-forms-prepared', type: 'checkbox', label: 'Monitoring forms and digital devices prepared' },
                { id: 'tools-calibrated', type: 'checkbox', label: 'Data collection tools calibrated and connectivity tested' },
                { id: 'logistics-confirmed', type: 'checkbox', label: 'Field logistics confirmed (transport, safety gear, ID)', required: true },
                { id: 'prep-notes', type: 'textarea', label: 'Preparation Notes', placeholder: 'Enter any notes...' },
                { id: 'prep-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'monitoring-execution',
            title: 'Section 2 — Monitoring Execution',
            description: 'Conduct field site visits and record findings',
            estimatedDuration: 120,
            requiresLocation: false,
            fields: [
                { id: 'sites-visited', type: 'checkbox', label: 'Field sites visited or phone verifications conducted as per schedule' },
                { id: 'spot-checks-done', type: 'checkbox', label: 'At least 3 field activities spot-checked for quality and compliance', required: true },
                { id: 'staff-performance-documented', type: 'checkbox', label: 'Staff performance observed and documented' },
                { id: 'targets-alignment-verified', type: 'checkbox', label: 'Alignment with weekly targets and deliverables verified' },
                { id: 'gps-evidence-captured', type: 'checkbox', label: 'Photos or GPS-tagged evidence captured for each visit' },
                { id: 'issues-recorded', type: 'checkbox', label: 'Issues, discrepancies, or best practices recorded' },
                { id: 'beneficiaries-interviewed', type: 'checkbox', label: 'Sample beneficiaries interviewed to confirm delivery quality' },
                { id: 'monitoring-tracker-updated', type: 'checkbox', label: 'Monitoring tracker updated after each site visit', required: true },
                { id: 'sites-visited-count', type: 'number', label: 'Number of Sites Visited', placeholder: '0', required: true },
                { id: 'spot-checks-count', type: 'number', label: 'Spot Checks Completed', placeholder: '0', required: true },
                { id: 'issues-flagged-count', type: 'number', label: 'Issues Flagged', placeholder: '0' },
                { id: 'execution-notes', type: 'textarea', label: 'Monitoring Execution Notes', placeholder: 'Describe findings...' },
                { id: 'execution-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'quality-control-review',
            title: 'Section 3 — Quality Control Review',
            description: 'Review call centre recordings, cross-check data and identify gaps',
            estimatedDuration: 60,
            requiresLocation: false,
            fields: [
                { id: 'call-recordings-reviewed', type: 'checkbox', label: 'Sample call-centre recordings listened to and evaluated', required: true },
                { id: 'field-data-crosschecked', type: 'checkbox', label: 'Field data cross-checked with CRM entries', required: true },
                { id: 'messaging-consistency-reviewed', type: 'checkbox', label: 'Consistency of messaging and reporting reviewed' },
                { id: 'findings-recorded', type: 'checkbox', label: 'Findings recorded in QA report template' },
                { id: 'corrective-actions-recommended', type: 'checkbox', label: 'Gaps identified and corrective actions recommended' },
                { id: 'callcentre-logs-reviewed-count', type: 'number', label: 'Call-Centre Logs Reviewed', placeholder: '0', required: true },
                { id: 'data-accuracy-pct', type: 'number', label: 'Data Accuracy (%)', placeholder: '0' },
                { id: 'issues-resolved-count', type: 'number', label: 'Issues Resolved (count)', placeholder: '0' },
                { id: 'qa-notes', type: 'textarea', label: 'QA Review Notes', placeholder: 'Enter findings and observations...' },
                { id: 'qa-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'reporting-followup',
            title: 'Section 4 — Reporting & Follow-Up',
            description: 'Compile and submit weekly monitoring report and verify corrective actions',
            estimatedDuration: 20,
            requiresLocation: false,
            fields: [
                { id: 'weekly-report-compiled', type: 'checkbox', label: 'Weekly monitoring report compiled (sites visited, findings, issues)', required: true },
                { id: 'report-submitted-friday', type: 'checkbox', label: 'Report submitted by Friday 3pm', required: true },
                { id: 'urgent-items-highlighted', type: 'checkbox', label: 'Urgent items requiring escalation highlighted' },
                { id: 'lessons-shared', type: 'checkbox', label: 'Lessons learned shared during weekly review' },
                { id: 'corrective-actions-verified', type: 'checkbox', label: 'Corrective actions verified as implemented' },
                { id: 'qa-reports-submitted-count', type: 'number', label: 'QA Reports Submitted', placeholder: '0' },
                { id: 'reporting-notes', type: 'textarea', label: 'Reporting Notes', placeholder: 'Enter any notes...' },
                { id: 'reporting-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'sign-off',
            title: 'Supervisor Sign-off',
            description: 'Supervisor confirms all sections are complete and accurate',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                { id: 'signoff-supervisor-name', type: 'text', label: 'Supervisor Name', autoPopulate: 'supervisorName', required: true },
                { id: 'signoff-date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'signoff-signature', type: 'text', label: 'Signature', placeholder: 'Type full name as signature', required: true }
            ]
        },

        {
            id: 'summary',
            title: 'Summary & KPIs',
            description: 'Auto-generated summary of the weekly field monitoring performance',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                {
                    id: 'field-monitoring-qa-summary',
                    type: 'summary',
                    label: 'Weekly Field Monitoring & QA Performance Summary'
                }
            ]
        }
    ]
};