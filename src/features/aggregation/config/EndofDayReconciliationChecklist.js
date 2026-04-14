/**
 * End of Day Reconciliation Checklist
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const endOfDayReconciliationConfig = {
    id: 'aggregation-end-of-day',
    title: 'End of Day Reconciliation Checklist',
    description: 'Filled by Hub Coordinator at end of each session day — closes operational activity and tracks session status',

    sections: [
        {
            id: 'session-link',
            title: 'Session Information',
            icon: '📋',
            description: 'Identify the session and day being reconciled',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                { id: 'session-id-ref', type: 'text', label: 'Session ID', placeholder: 'Enter active session ID', required: true },
                { id: 'hub', type: 'text', label: 'Hub', placeholder: 'Enter hub name', required: true },
                { id: 'date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'hub-coordinator-name', type: 'text', label: 'Hub Coordinator Name', autoPopulate: 'supervisorName', required: true },
                { id: 'session-day-number', type: 'number', label: 'Day Number of This Session', placeholder: '1', required: true },
                {
                    id: 'is-final-day',
                    type: 'select',
                    label: 'Is This the Final Day of the Session?',
                    options: [
                        { value: 'yes', label: 'Yes — close session after reconciliation' },
                        { value: 'no', label: 'No — session continues tomorrow' }
                    ],
                    required: true
                }
            ]
        },

        {
            id: 'volume-reconciliation',
            title: 'Section 1 — Volume Reconciliation',
            icon: '⚖️',
            description: 'Match today\'s totals against weighing and GGEM records',
            estimatedDuration: 15,
            requiresLocation: false,
            fields: [
                { id: 'farmers-attended-today', type: 'number', label: 'Total Farmers Attended Today', placeholder: '0', required: true },
                { id: 'farmers-booked-today', type: 'number', label: 'Total Booked Farmers Today', placeholder: '0', required: true },
                { id: 'unbooked-farmers-handled', type: 'number', label: 'Unbooked Farmers Handled', placeholder: '0' },
                { id: 'total-bags-today', type: 'number', label: 'Total Bags Received Today', placeholder: '0', required: true },
                { id: 'total-weight-today-kg', type: 'number', label: 'Total Weight Today (kg)', placeholder: '0', required: true },
                { id: 'totals-match-ggem', type: 'checkbox', label: 'Today\'s totals match GGEM app records', required: true },
                { id: 'totals-match-security', type: 'checkbox', label: 'Today\'s totals match Security records', required: true },
                { id: 'discrepancy-found', type: 'checkbox', label: 'Discrepancy found between records' },
                { id: 'discrepancy-details', type: 'textarea', label: 'Discrepancy Details (if any)', placeholder: 'Describe discrepancy and action taken...' }
            ]
        },

        {
            id: 'checklists-confirmation',
            title: 'Section 2 — Team Checklists Confirmation',
            icon: '✅',
            description: 'Confirm all team checklists have been submitted for today',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                { id: 'quality-checklist-submitted', type: 'checkbox', label: 'Quality Control & Grading checklist submitted', required: true },
                { id: 'weighing-checklist-submitted', type: 'checkbox', label: 'Weighing & Recording checklist submitted', required: true },
                { id: 'warehouse-checklist-submitted', type: 'checkbox', label: 'Warehouse & Stock Receiving checklist submitted', required: true },
                { id: 'all-receipts-accounted', type: 'checkbox', label: 'All farmer receipts accounted for', required: true },
                { id: 'ggem-entries-complete', type: 'checkbox', label: 'All GGEM app entries complete and synced', required: true }
            ]
        },

        {
            id: 'end-of-day-operations',
            title: 'Section 3 — End of Day Operations',
            icon: '🔒',
            description: 'Confirm all stations are closed, cleaned, and secured',
            estimatedDuration: 10,
            requiresLocation: false,
            fields: [
                { id: 'all-stations-cleaned', type: 'checkbox', label: 'All stations cleaned and secured', required: true },
                { id: 'warehouse-locked', type: 'checkbox', label: 'Warehouse locked', required: true },
                { id: 'equipment-stored', type: 'checkbox', label: 'All equipment stored safely' },
                { id: 'casuals-signed-out', type: 'checkbox', label: 'All casual labourers signed out' },
                { id: 'reversals-today', type: 'checkbox', label: 'Any reversals made today' },
                { id: 'reversals-count-today', type: 'number', label: 'Number of Reversals Today', placeholder: '0' },
                { id: 'reversals-details-today', type: 'textarea', label: 'Reversal Details', placeholder: 'Describe reversals made today and reasons...' },
                { id: 'incidents-today', type: 'textarea', label: 'Incidents or Issues to Report', placeholder: 'Describe any incidents...' },
                { id: 'end-of-day-timestamp', type: 'time', label: 'End of Day Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'session-closure',
            title: 'Section 4 — Session Closure',
            icon: '🏁',
            description: 'Complete only if this is the final day of the session',
            estimatedDuration: 10,
            requiresLocation: false,
            fields: [
                { id: 'session-total-farmers', type: 'number', label: 'Total Farmers for Full Session', placeholder: '0' },
                { id: 'session-total-weight-kg', type: 'number', label: 'Total Session Weight (kg)', placeholder: '0' },
                { id: 'session-total-gross-mwk', type: 'number', label: 'Total Session Gross Amount (MWK)', placeholder: '0' },
                { id: 'session-total-reversals', type: 'number', label: 'Total Reversals for Session', placeholder: '0' },
                { id: 'all-checklists-confirmed', type: 'checkbox', label: 'All session checklists confirmed submitted' },
                { id: 'finance-notified-closure', type: 'checkbox', label: 'Finance team notified of session closure for payment processing' },
                { id: 'session-ready-to-close', type: 'checkbox', label: 'Session confirmed ready to close', required: false },
                { id: 'closure-notes', type: 'textarea', label: 'Session Closure Notes', placeholder: 'Any final notes for this session...' }
            ]
        },

        {
            id: 'sign-off',
            title: 'Hub Coordinator Sign-off',
            icon: '🖊️',
            description: 'Hub Coordinator confirms end of day reconciliation is complete',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                { id: 'signoff-coordinator-name', type: 'text', label: 'Hub Coordinator Name', autoPopulate: 'supervisorName', required: true },
                { id: 'signoff-date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'signoff-signature', type: 'text', label: 'Signature', placeholder: 'Type full name as signature', required: true }
            ]
        },

        {
            id: 'summary',
            title: 'End of Day Summary',
            icon: '📊',
            description: 'Auto-generated end of day reconciliation summary',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                {
                    id: 'end-of-day-summary',
                    type: 'summary',
                    label: 'End of Day Reconciliation Summary'
                }
            ]
        }
    ]
};