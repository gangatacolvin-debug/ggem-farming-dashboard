/**
 * Quality Control & Grading Checklist
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const qualityControlGradingConfig = {
    id: 'aggregation-quality-control',
    title: 'Quality Control & Grading Checklist',
    description: 'Filled by Security Lead — moisture testing and quality assessment before weighing',

    sections: [
        {
            id: 'session-link',
            title: 'Session Information',
            icon: '📋',
            description: 'Link this checklist to the active aggregation session',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                { id: 'session-id-ref', type: 'text', label: 'Session ID', placeholder: 'Enter active session ID', required: true },
                { id: 'hub', type: 'text', label: 'Hub', placeholder: 'Enter hub name', required: true },
                { id: 'date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'security-lead-name', type: 'text', label: 'Security Lead Name', autoPopulate: 'supervisorName', required: true },
                { id: 'security-person-2', type: 'text', label: 'Second Security Person', placeholder: 'Enter name' }
            ]
        },

        {
            id: 'pre-start-checks',
            title: 'Section 1 — Pre-Start Checks',
            icon: '🔍',
            description: 'Confirm tools and area are ready before first farmer arrives',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                { id: 'moisture-tester-working', type: 'checkbox', label: 'Moisture tester confirmed working', required: true },
                { id: 'grading-area-clean', type: 'checkbox', label: 'Grading area clean and organised', required: true },
                { id: 'grading-criteria-communicated', type: 'checkbox', label: 'Grading criteria communicated to all team members', required: true },
                { id: 'warehousing-rep-present', type: 'checkbox', label: 'Warehousing & Processing representative present at quality station', required: true }
            ]
        },

        {
            id: 'moisture-grading-log',
            title: 'Section 2 — Moisture Testing & Grading Log',
            icon: '💧',
            description: 'Record moisture test result and grade for each farmer batch',
            estimatedDuration: 120,
            requiresLocation: false,
            fields: [
                {
                    id: 'moisture-grading-logs',
                    type: 'log-table',
                    label: 'Moisture & Grading Records',
                    columns: [
                        { key: 'clubGroupName', label: 'Club / Group', type: 'text', placeholder: 'Club name' },
                        { key: 'farmerName', label: 'Farmer Name', type: 'text', placeholder: 'Full name' },
                        { key: 'variety', label: 'Variety', type: 'text', placeholder: 'Kilombero / Kayanjamalo' },
                        { key: 'moisturePct', label: 'Moisture %', type: 'number', placeholder: '12' },
                        { key: 'grade', label: 'Grade', type: 'text', placeholder: 'B1 / B2 / B3 / Reject' },
                        { key: 'decision', label: 'Decision', type: 'text', placeholder: 'Accepted / Rejected' },
                        { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Any exceptions...' }
                    ]
                }
            ]
        },

        {
            id: 'quality-assessment',
            title: 'Section 3 — Quality Assessment',
            icon: '✅',
            description: 'Record quality inspection findings across all batches',
            estimatedDuration: 30,
            requiresLocation: false,
            fields: [
                { id: 'mixed-variety-found', type: 'checkbox', label: 'Mixed variety batches found' },
                { id: 'contamination-found', type: 'checkbox', label: 'Contamination found (maize, stones, debris)' },
                { id: 'mud-debris-found', type: 'checkbox', label: 'Mud or debris present in any batch' },
                { id: 'sprouting-spoilage-found', type: 'checkbox', label: 'Sprouting or spoilage found' },
                { id: 'batches-rejected-count', type: 'number', label: 'Total Batches Rejected', placeholder: '0' },
                { id: 'batches-downgraded-count', type: 'number', label: 'Total Batches Downgraded', placeholder: '0' },
                { id: 'quality-exceptions-details', type: 'textarea', label: 'Quality Exception Details', placeholder: 'Describe any issues found...' },
                { id: 'quality-timestamp', type: 'time', label: 'Quality Check Completed At', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'sign-off',
            title: 'Security Lead Sign-off',
            icon: '🖊️',
            description: 'Security Lead confirms quality checks are complete',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                { id: 'signoff-security-name', type: 'text', label: 'Security Lead Name', autoPopulate: 'supervisorName', required: true },
                { id: 'signoff-date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'signoff-signature', type: 'text', label: 'Signature', placeholder: 'Type full name as signature', required: true }
            ]
        },

        {
            id: 'summary',
            title: 'Quality Control Summary',
            icon: '📊',
            description: 'Auto-generated quality control summary',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                {
                    id: 'quality-control-summary',
                    type: 'summary',
                    label: 'Quality Control & Grading Summary'
                }
            ]
        }
    ]
};