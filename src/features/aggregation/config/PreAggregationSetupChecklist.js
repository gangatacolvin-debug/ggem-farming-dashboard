/**
 * Pre-Aggregation Setup Checklist
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const preAggregationSetupConfig = {
    id: 'pre-aggregation-setup',
    title: 'Pre-Aggregation Setup Checklist',
    description: 'Opened by the Aggregation Administrator to start a new session',

    sections: [
        {
            id: 'session-header',
            title: 'Session Information',
            icon: '📋',
            description: 'Create and identify this aggregation session',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                { id: 'session-id', type: 'text', label: 'Session ID', placeholder: 'Auto-generated', readOnly: true },
                {
                    id: 'hub',
                    type: 'select',
                    label: 'Hub',
                    options: [
                        { value: 'dwangwa-hub', label: 'Dwangwa Hub' },
                        { value: 'linga-hub', label: 'Linga Hub' },
                        { value: 'suluwi-hub', label: 'Suluwi Hub' },
                        { value: 'salima-hub', label: 'Salima Hub' }
                    ],
                    required: true
                },
                {
                    id: 'aggregation-team-firestore-info',
                    type: 'info',
                    label: 'Staff directory (Firestore)',
                    content:
                        'Team dropdowns load from the users collection: hub = the hub selected above, status = active, and role as labeled on each field. Users can be from any department.'
                },
                {
                    id: 'hub-coordinator-uid',
                    type: 'firestore-select',
                    label: 'Hub Coordinator on Duty',
                    collection: 'users',
                    hubFormField: 'hub',
                    valueField: 'docId',
                    filters: [
                        { field: 'status', operator: '==', value: 'active' },
                        { field: 'role', operator: '==', value: 'hub-coordinator' }
                    ],
                    sessionSaveKey: 'hubCoordinatorUid',
                    required: true
                },
                { id: 'session-date', type: 'date', label: 'Session Date', autoPopulate: 'date', required: true },
                { id: 'admin-name', type: 'text', label: 'Aggregation Administrator', autoPopulate: 'supervisorName', required: true },
                { id: 'expected-farmers', type: 'number', label: 'Expected Number of Farmers Today', placeholder: '0', required: true, sessionSaveKey: 'expectedFarmers' },
                { id: 'aggregation-day-number', type: 'number', label: 'Day Number of Session', placeholder: '1' }
            ]
        },

        {
            id: 'team-staffing',
            title: 'Section 1 — Team & Staffing',
            icon: '👥',
            description: 'Confirm all teams are present and briefed before starting',
            estimatedDuration: 10,
            requiresLocation: false,
            fields: [
                { id: 'hub-coordinator-present', type: 'checkbox', label: 'Hub Coordinator confirmed on duty', required: true },
                { id: 'security-team-present', type: 'checkbox', label: 'Security Team present and briefed (both security personnel)', required: true },
                {
                    id: 'security-lead-uid',
                    type: 'firestore-select',
                    label: 'Security Lead',
                    collection: 'users',
                    hubFormField: 'hub',
                    valueField: 'docId',
                    filters: [
                        { field: 'status', operator: '==', value: 'active' },
                        { field: 'role', operator: '==', value: 'security-lead' }
                    ],
                    sessionSaveKey: 'securityLeadUid',
                    required: true
                },
                { id: 'data-team-present', type: 'checkbox', label: 'Data & Receipting Team present and briefed', required: true },
                {
                    id: 'data-team-representative-uid',
                    type: 'firestore-select',
                    label: 'Data & Receipting representative',
                    collection: 'users',
                    hubFormField: 'hub',
                    valueField: 'docId',
                    filters: [
                        { field: 'status', operator: '==', value: 'active' },
                        { field: 'role', operator: '==', value: 'data-team' }
                    ],
                    sessionSaveKey: 'dataTeamUid',
                    required: true
                },
                { id: 'warehouse-team-present', type: 'checkbox', label: 'Warehouse & Processing Team present', required: true },
                {
                    id: 'warehouse-supervisor-uid',
                    type: 'firestore-select',
                    label: 'Warehouse & Processing lead',
                    collection: 'users',
                    hubFormField: 'hub',
                    valueField: 'docId',
                    filters: [
                        { field: 'status', operator: '==', value: 'active' },
                        { field: 'role', operator: '==', value: 'warehouse-supervisor' }
                    ],
                    sessionSaveKey: 'warehouseSupervisorUid',
                    required: true
                },
                { id: 'casual-labourers-confirmed', type: 'checkbox', label: 'Casual labourers confirmed and assigned to stations' },
                { id: 'total-staff-count', type: 'number', label: 'Total Staff on Ground (count)', placeholder: '0' },
                { id: 'staffing-notes', type: 'textarea', label: 'Staffing Notes / Absences', placeholder: 'Note any absent staff or changes...' }
            ]
        },

        {
            id: 'equipment-materials',
            title: 'Section 2 — Equipment & Materials',
            icon: '⚙️',
            description: 'Verify all equipment and materials are ready before farmers arrive',
            estimatedDuration: 10,
            requiresLocation: false,
            fields: [
                { id: 'weighing-scales-ready', type: 'checkbox', label: 'Weighing scales available and calibrated', required: true },
                { id: 'moisture-testers-ready', type: 'checkbox', label: 'Moisture testers available and functional', required: true },
                { id: 'tents-tarpaulins-setup', type: 'checkbox', label: 'Tents and tarpaulins set up' },
                { id: 'sacks-available', type: 'checkbox', label: 'Company sacks available and sufficient' },
                { id: 'stickers-labels-ready', type: 'checkbox', label: 'Stickers and labels ready' },
                { id: 'devices-charged', type: 'checkbox', label: 'All mobile devices charged and functional', required: true },
                { id: 'ggem-app-accessible', type: 'checkbox', label: 'GGEM app accessible and syncing correctly', required: true },
                { id: 'receipt-system-ready', type: 'checkbox', label: 'Receipt system ready at receipting desk', required: true },
                { id: 'equipment-notes', type: 'textarea', label: 'Equipment Issues / Notes', placeholder: 'Note any missing or faulty equipment...' }
            ]
        },

        {
            id: 'logistics-communication',
            title: 'Section 3 — Logistics & Communication',
            icon: '📡',
            description: 'Confirm logistics and communication channels are in place',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                { id: 'transport-confirmed', type: 'checkbox', label: 'Transport to hub confirmed' },
                { id: 'callcentre-notified', type: 'checkbox', label: 'Call centre notified of aggregation day and target farmers' },
                { id: 'farmers-notified', type: 'checkbox', label: 'Booked farmers notified and confirmed' },
                { id: 'finance-notified', type: 'checkbox', label: 'Finance team notified of session opening' },
                { id: 'logistics-notes', type: 'textarea', label: 'Logistics Notes', placeholder: 'Enter any logistics issues...' },
                { id: 'session-open-timestamp', type: 'time', label: 'Session Open Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'sign-off',
            title: 'Administrator Sign-off',
            icon: '🖊️',
            description: 'Administrator confirms session is ready to begin',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                { id: 'signoff-admin-name', type: 'text', label: 'Administrator Name', autoPopulate: 'supervisorName', required: true },
                { id: 'signoff-date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'signoff-signature', type: 'text', label: 'Signature', placeholder: 'Type full name as signature', required: true }
            ]
        },

        {
            id: 'summary',
            title: 'Session Setup Summary',
            icon: '📊',
            description: 'Auto-generated summary of session setup',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                {
                    id: 'pre-aggregation-setup-summary',
                    type: 'summary',
                    label: 'Pre-Aggregation Setup Summary'
                }
            ]
        }
    ]
};