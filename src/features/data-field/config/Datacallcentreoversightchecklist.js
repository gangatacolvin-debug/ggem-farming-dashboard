/**
 * Data & Call Centre Oversight - Daily Checklist
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const dataCallCentreOversightChecklistConfig = {
    id: 'data-callcentre-oversight',
    title: 'Data & Call Centre Oversight Checklist',
    description: 'Daily supervision of call centre agents, data entry and verification',

    sections: [
        {
            id: 'header',
            title: 'Header Information',
            description: 'Record basic information before starting',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                { id: 'checklist-id', type: 'text', label: 'Checklist ID', placeholder: 'Auto-generated', readOnly: true },
                { id: 'date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'shift-batch', type: 'text', label: 'Shift / Batch #', placeholder: 'Enter shift or batch number', required: true },
                { id: 'supervisor-name', type: 'text', label: 'Supervisor Name', autoPopulate: 'supervisorName', required: true },
                { id: 'line-manager', type: 'text', label: 'Line Manager', placeholder: 'Enter line manager name', required: true }
            ]
        },

        {
            id: 'callcentre-supervision',
            title: 'Section 1 — Call Centre Supervision',
            description: 'Oversee call centre agents, verify call outcomes and quality',
            estimatedDuration: 30,
            requiresLocation: false,
            fields: [
                { id: 'agents-briefed', type: 'checkbox', label: 'All call centre agents briefed for the day', required: true },
                { id: 'active-agents-count', type: 'number', label: 'Number of Active Agents', placeholder: '0', required: true },
                { id: 'calls-made-count', type: 'number', label: 'Total Calls Made Today', placeholder: '0', required: true },
                { id: 'sms-sent-count', type: 'number', label: 'Total SMS Sent Today', placeholder: '0' },
                { id: 'farmers-reached-count', type: 'number', label: 'Number of Farmers Successfully Reached', placeholder: '0', required: true },
                { id: 'farmer-issues-escalated', type: 'checkbox', label: 'Farmer issues escalated to central team (if any)' },
                { id: 'call-outcomes-logged', type: 'checkbox', label: 'All call outcomes logged correctly in CRM', required: true },
                { id: 'call-list-aligned', type: 'checkbox', label: 'Today\'s call list aligned with weekly outreach and content plan' },
                { id: 'spot-checks-completed', type: 'checkbox', label: 'Daily call quality spot-checks completed', required: true },
                { id: 'issues-feedback-today', type: 'textarea', label: 'Key Issues or Feedback Reported Today', placeholder: 'Describe any issues or feedback...' },
                { id: 'callcentre-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'data-collection-oversight',
            title: 'Section 2 — Data Collection Oversight',
            description: 'Verify data collectors attendance, tools, and submission quality',
            estimatedDuration: 30,
            requiresLocation: false,
            fields: [
                { id: 'collectors-on-duty-count', type: 'number', label: 'Total Data Collectors on Duty', placeholder: '0', required: true },
                { id: 'attendance-route-confirmed', type: 'checkbox', label: 'Attendance and route plans confirmed in CRM' },
                { id: 'latest-forms-confirmed', type: 'checkbox', label: 'All collectors using latest approved survey forms confirmed', required: true },
                { id: 'device-issues-found', type: 'checkbox', label: 'App, device, or syncing issues found' },
                { id: 'device-issues-details', type: 'textarea', label: 'Device / Syncing Issue Details (if any)', placeholder: 'Describe issue and resolution...' },
                { id: 'fmt-verified-submissions', type: 'checkbox', label: 'FMT verified data collectors\' submissions', required: true },
                { id: 'spot-checks-accuracy', type: 'checkbox', label: 'At least three spot-checks for data accuracy conducted', required: true },
                { id: 'corrective-actions-recorded', type: 'checkbox', label: 'Corrective actions recorded for incomplete or duplicate data' },
                { id: 'gps-timestamps-verified', type: 'checkbox', label: 'GPS, timestamps, and media uploads verified as attached', required: true },
                { id: 'data-collection-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'farmer-data-entries',
            title: 'Section 3 — Farmer Data Entries',
            description: 'Verify all farmer registration and field monitoring entries for the day',
            estimatedDuration: 20,
            requiresLocation: false,
            fields: [
                { id: 'new-farmer-registrations-count', type: 'number', label: 'New Farmer Registrations Submitted Today', placeholder: '0', required: true },
                { id: 'farmer-training-records-count', type: 'number', label: 'Farmer Training Attendance Records Entered Today', placeholder: '0' },
                { id: 'field-monitoring-entries-count', type: 'number', label: 'Field Follow-Up or Monitoring Entries Logged Today', placeholder: '0' },
                { id: 'farmer-data-accuracy-verified', type: 'checkbox', label: 'Data accuracy verified against field attendance lists or cluster reports', required: true },
                { id: 'gps-timestamp-confirmed', type: 'checkbox', label: 'GPS location and timestamp confirmed for each entry', required: true },
                { id: 'duplicates-identified', type: 'checkbox', label: 'Duplicate, incomplete, or erroneous entries identified' },
                { id: 'feedback-to-collector', type: 'checkbox', label: 'Feedback provided to responsible data collector or FMT' },
                { id: 'farmer-summary-submitted', type: 'checkbox', label: 'Farmer data summary submitted to FMT lead before close of day', required: true },
                { id: 'farmer-data-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'partner-data-entries',
            title: 'Section 4 — Partner Data Entries',
            description: 'Verify all partner registration and coordination records for the day',
            estimatedDuration: 20,
            requiresLocation: false,
            fields: [
                { id: 'partner-records-count', type: 'number', label: 'Partner Registration or Support Records Entered Today', placeholder: '0' },
                { id: 'partner-followups-count', type: 'number', label: 'Partner Follow-Up or Coordination Updates Submitted', placeholder: '0' },
                { id: 'partner-reports-verified', type: 'checkbox', label: 'All partner reports reviewed and verified by FMT', required: true },
                { id: 'partner-completeness-checked', type: 'checkbox', label: 'Completeness checked (partner name, date, location, activity, outcome)' },
                { id: 'missing-submissions-noted', type: 'checkbox', label: 'Missing or delayed partner submissions noted' },
                { id: 'partner-issues-escalated', type: 'textarea', label: 'Partner Issues Requiring Escalation (if any)', placeholder: 'Describe issues...' },
                { id: 'partner-data-submitted', type: 'checkbox', label: 'Verified partner data submitted to Monitoring Officer for approval', required: true },
                { id: 'partner-data-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'kiosk-data-entries',
            title: 'Section 5 — Kiosk Data Entries',
            description: 'Verify kiosk transactions and reconcile against Odoo records',
            estimatedDuration: 20,
            requiresLocation: false,
            fields: [
                { id: 'kiosk-transactions-count', type: 'number', label: 'Kiosk Transactions Recorded Today', placeholder: '0', required: true },
                { id: 'kiosk-transactions-verified', type: 'checkbox', label: 'All kiosk transactions verified in Odoo', required: true },
                { id: 'kiosk-discrepancies-found', type: 'checkbox', label: 'Discrepancies found between kiosk data and daily reports' },
                { id: 'kiosk-discrepancy-details', type: 'textarea', label: 'Discrepancy Details (if any)', placeholder: 'Describe discrepancy...' },
                { id: 'reconciliation-confirmed', type: 'checkbox', label: 'Cash or mobile-money reconciliation confirmed completed by kiosk operator', required: true },
                { id: 'kiosk-entry-completeness', type: 'checkbox', label: 'Each kiosk entry verified to include date, item sold, and transaction ID' },
                { id: 'odoo-crosscheck-done', type: 'checkbox', label: 'Odoo data cross-checked with physical receipts and sales tracker' },
                { id: 'kiosk-summary-submitted', type: 'checkbox', label: 'Final kiosk verification summary submitted to supervisor', required: true },
                { id: 'kiosk-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'quality-compliance',
            title: 'Section 6 — Quality & Compliance Checks',
            description: 'Final quality review of all data entries and compliance verification',
            estimatedDuration: 15,
            requiresLocation: false,
            fields: [
                { id: 'ten-pct-sample-reviewed', type: 'checkbox', label: '10% sample of all data entries reviewed (farmers, partners, kiosks)', required: true },
                { id: 'no-blank-entries', type: 'checkbox', label: 'No blank or placeholder entries remaining in CRM confirmed', required: true },
                { id: 'escalated-issues-have-owners', type: 'checkbox', label: 'All escalated issues verified to have assigned owners for resolution' },
                { id: 'backup-copies-saved', type: 'checkbox', label: 'Backup copies or exports of daily data saved', required: true },
                { id: 'verified-entries-pct', type: 'number', label: 'Verified Entries (%)', placeholder: '0' },
                { id: 'issues-flagged-count', type: 'number', label: 'Issues Flagged', placeholder: '0' },
                { id: 'issues-resolved-count', type: 'number', label: 'Issues Resolved (count)', placeholder: '0' },
                { id: 'quality-notes', type: 'textarea', label: 'Quality & Compliance Notes', placeholder: 'Enter any observations...' },
                { id: 'quality-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
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
            description: 'Auto-generated summary of the daily data and call centre performance',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                {
                    id: 'data-callcentre-oversight-summary',
                    type: 'summary',
                    label: 'Daily Data & Call Centre Oversight Performance Summary'
                }
            ]
        }
    ]
};