/**
 * Weighing & Recording Checklist
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const weighingRecordingConfig = {
    id: 'aggregation-weighing-recording',
    title: 'Weighing & Recording Checklist',
    description: 'Filled by Security Lead live at the weighing station — entered directly into system per farmer',

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
                { id: 'security-lead-name', type: 'text', label: 'Security Lead Name', autoPopulate: 'supervisorName', required: true }
            ]
        },

        {
            id: 'weighing-station-checks',
            title: 'Section 1 — Weighing Station Checks',
            icon: '⚖️',
            description: 'Confirm weighing station is ready before starting',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                { id: 'scale-calibrated', type: 'checkbox', label: 'Weighing scale calibrated and verified', required: true },
                { id: 'scale-zeroed', type: 'checkbox', label: 'Scale zeroed before first weighing', required: true },
                { id: 'weighing-area-clear', type: 'checkbox', label: 'Weighing area clear of congestion', required: true },
                { id: 'device-ready', type: 'checkbox', label: 'Device ready for live entry', required: true },
                { id: 'weighing-start-time', type: 'time', label: 'Weighing Start Time', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'farmer-weighing-log',
            title: 'Section 2 — Farmer Weighing Log',
            icon: '📝',
            description: 'Record each farmer directly into the system at the weighing station',
            estimatedDuration: 180,
            requiresLocation: false,
            fields: [
                {
                    id: 'farmer-weighing-logs',
                    type: 'log-table',
                    label: 'Farmer Weighing Records',
                    columns: [
                        { key: 'clubGroupName', label: 'Club / Group', type: 'text', placeholder: 'Club name' },
                        { key: 'farmerName', label: 'Farmer Name', type: 'text', placeholder: 'Full name' },
                        { 
                            key: 'farmerType', 
                            label: 'Farmer Type', 
                            type: 'select', 
                            options: [
                                { label: 'GGEM Farmer', value: 'GGEM Farmer' },
                                { label: 'GGEM Farmer O/M Price', value: 'GGEM Farmer O/M Price' },
                                { label: 'Open Market Farmer', value: 'Open Market Farmer' }
                            ]
                        },
                        { 
                            key: 'variety', 
                            label: 'Product', 
                            type: 'select', 
                            options: [
                                { label: 'Kilombero', value: 'Kilombero' },
                                { label: 'Kayanjamalo', value: 'Kayanjamalo' }
                            ]
                        },
                        { 
                            key: 'grade', 
                            label: 'Band Moisture', 
                            type: 'select', 
                            options: [
                                { label: 'B1 (0-13%)', value: 'B1' },
                                { label: 'B2 (14-18%)', value: 'B2' },
                                { label: 'B3 (19-22%)', value: 'B3' }
                            ]
                        },
                        { key: 'weightKg', label: 'Weight (kg)', type: 'number', placeholder: '0' },
                        { 
                            key: 'pricePerKg', 
                            label: 'Price/kg', 
                            type: 'select', 
                            options: Array.from({ length: 21 }, (_, i) => ({
                                label: (1000 + i * 100).toLocaleString(),
                                value: String(1000 + i * 100)
                            }))
                        },
                        { 
                            key: 'grossAmount', 
                            label: 'Gross (MWK)', 
                            type: 'number', 
                            readOnly: true,
                            calculation: { operation: 'multiply', sources: ['weightKg', 'pricePerKg'] } 
                        },
                        { key: 'farmerVerified', label: 'Farmer Verified', type: 'text', placeholder: 'Yes / No' },
                        { key: 'receiptIssued', label: 'Receipt Issued', type: 'text', placeholder: 'Yes / No' }
                    ]
                }
            ]
        },

        {
            id: 'weighing-summary-checks',
            title: 'Section 3 — End of Weighing Checks',
            icon: '🔒',
            description: 'Confirm all weighing records are complete before closing station',
            estimatedDuration: 10,
            requiresLocation: false,
            fields: [
                { id: 'all-receipts-issued', type: 'checkbox', label: 'All receipts issued to farmers', required: true },
                { id: 'farmer-records-matched', type: 'checkbox', label: 'All farmer records cross-checked against security log', required: true },
                { id: 'no-pending-farmers', type: 'checkbox', label: 'No farmers waiting without a record' },
                { id: 'total-farmers-weighed', type: 'number', label: 'Total Farmers Weighed', placeholder: '0', readOnly: true },
                { id: 'total-weight-kg', type: 'number', label: 'Total Weight (kg)', placeholder: '0', readOnly: true },
                { id: 'total-gross-amount', type: 'number', label: 'Total Gross Amount (MWK)', placeholder: '0', readOnly: true },
                { id: 'reversals-done', type: 'checkbox', label: 'Any reversals or corrections made during weighing' },
                { id: 'reversals-details', type: 'textarea', label: 'Reversal / Correction Details', placeholder: 'Describe what was corrected and why...' },
                { id: 'weighing-end-time', type: 'time', label: 'Weighing End Time', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'sign-off',
            title: 'Security Lead Sign-off',
            icon: '🖊️',
            description: 'Security Lead confirms weighing records are complete and accurate',
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
            title: 'Weighing & Recording Summary',
            icon: '📊',
            description: 'Auto-generated weighing session summary',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                {
                    id: 'weighing-recording-summary',
                    type: 'summary',
                    label: 'Weighing & Recording Performance Summary'
                }
            ]
        }
    ]
};