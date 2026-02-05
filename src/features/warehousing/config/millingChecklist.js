/**
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const millingChecklistConfig = {
    id: 'milling-process',
    title: 'Milling Process Checklist with Hourly Progress',
    description: 'Standard Operating Procedure for Milling Operations with Hourly Tracking',

    // Location verification (Must be at Main Warehouse/Mill)
    locationCheckpoints: {
        'mill-activation': 'main-warehouse',
        'hourly-checks': 'main-warehouse'
    },

    sections: [
        {
            id: 'team-allocation',
            title: 'Team Allocation & Shift Details',
            icon: '👥',
            description: 'Confirm team availability for the shift',
            fields: [
                { id: 'shift-date', type: 'date', label: 'Date', required: true },
                {
                    id: 'shift-type',
                    type: 'select',
                    label: 'Shift',
                    options: [
                        { value: 'morning', label: 'Morning' },
                        { value: 'afternoon', label: 'Afternoon' },
                        { value: 'night', label: 'Night' }
                    ],
                    required: true
                },
                { id: 'supervisor-name', type: 'text', label: 'Supervisor Name', placeholder: 'Enter name', required: true },
                {
                    id: 'team-allocation-info',
                    type: 'info',
                    label: 'Recommended Team Allocation (9 Members)',
                    content: '1 Generator Op, 2 Husk Team (+1 Driver), 2 White Polisher Team, 1 Air Compressor Op, 1 Mill Op, 2 QC/Stacking/Cleaning.'
                },
                { id: 'team-members-list', type: 'textarea', label: 'List Team Members Present', placeholder: 'Enter names of all 9 team members...' }
            ]
        },
        {
            id: 'pre-milling',
            title: 'Step 1: Pre-Milling Equipment & Setup',
            icon: '🔧',
            description: 'Generator, Husk, Polisher & Compressor checks',
            fields: [
                { id: 'generator-check', type: 'checkbox', label: 'Generator check: oil, coolant, fuel', required: true },
                { id: 'husk-receiver', type: 'checkbox', label: 'Husk Receiver: move, offload, replace (2 + driver)', required: true },
                { id: 'white-polisher', type: 'checkbox', label: 'White Polisher: clean bran tube (2)', required: true },
                { id: 'air-compressor', type: 'checkbox', label: 'Air Compressor: switch on, confirm pressure', required: true },
                { id: 'pre-checks-time', type: 'time', label: 'Timestamp pre-checks complete', required: true }
            ]
        },
        {
            id: 'mill-activation',
            title: 'Step 2: Mill Activation & Paddy Assessment',
            icon: '⚡',
            description: 'Start up and initial quality assessment',
            requiresLocation: true,
            fields: [
                { id: 'mill-switch-on', type: 'checkbox', label: 'Switch on the mill' },
                { id: 'initial-paddy-weight', type: 'number', label: 'Weigh paddy rice (kg)', placeholder: '0' },
                { id: 'moisture-content', type: 'number', label: 'Conduct moisture test (%)', placeholder: '14' },
                { id: 'rice-type', type: 'text', label: 'Record rice type', placeholder: 'e.g., Basmati, Kilombero' },
                { id: 'initial-qc', type: 'checkbox', label: 'Perform initial quality check' },
                { id: 'activation-time', type: 'time', label: 'Timestamp mill activation', required: true }
            ]
        },
        {
            id: 'milling-operations',
            title: 'Step 3: Milling Operations Setup',
            icon: '⚙️',
            description: 'Operational readiness confirmation',
            fields: [
                { id: 'feed-team-ready', type: 'checkbox', label: 'Paddy Feed Team: Feeding into mill (2)', required: true },
                { id: 'receiving-ready', type: 'checkbox', label: 'Rice Receiving: Receiving pure rice from scale (1)', required: true },
                { id: 'stacking-ready', type: 'checkbox', label: 'Stacking: Milled, Broken, Bran, Dust, Stones organized', required: true },
                { id: 'qc-ready', type: 'checkbox', label: 'Quality Check: Monitoring ongoing (2)', required: true },
                { id: 'cleaner-ready', type: 'checkbox', label: 'Cleaner: Maintaining hygiene (1)', required: true }
            ]
        },
        {
            id: 'hourly-checks',
            title: 'Step 4: Hourly Progress Checks',
            icon: '⏱️',
            description: 'Record inputs, outputs, and efficiency every hour',
            fields: [
                {
                    id: 'hourlyLogs',
                    type: 'log-table',
                    label: 'Hourly Production Log',
                    columns: [
                        { key: 'time', label: 'Time', type: 'time', placeholder: 'HH:MM' },
                        { key: 'unmilledBags', label: 'Unmilled Bags', type: 'number', placeholder: '0' },
                        { key: 'paddyFed', label: 'Paddy Fed (kg)', type: 'number', placeholder: '0' },
                        { key: 'milledRice', label: 'Milled (kg)', type: 'number', placeholder: '0' },
                        { key: 'brokenRice', label: 'Broken (kg)', type: 'number', placeholder: '0' },
                        { key: 'brokenHusk', label: 'Brk+Husk (kg)', type: 'number', placeholder: '0' },
                        { key: 'bran', label: 'Bran (kg)', type: 'number', placeholder: '0' },
                        { key: 'dust', label: 'Dust (kg)', type: 'number', placeholder: '0' },
                        { key: 'stones', label: 'Stones (kg)', type: 'number', placeholder: '0' },
                        { key: 'downtime', label: 'Downtime (min)', type: 'number', placeholder: '0' },
                        { key: 'notes', label: 'Incidents', type: 'text', placeholder: 'Notes...' }
                    ]
                }
            ]
        },
        {
            id: 'post-milling',
            title: 'Step 5: Post-Milling Summary',
            icon: '📝',
            description: 'End of Batch/Shift Summary & Validation',
            fields: [
                { id: 'total-unmilled', type: 'number', label: 'Total Unmilled Rice (kg)', required: true },
                { id: 'total-milled', type: 'number', label: 'Total Milled Rice (kg)', required: true },
                { id: 'total-broken', type: 'number', label: 'Total Broken Rice (kg)', required: true },
                { id: 'total-broken-husk', type: 'number', label: 'Total Broken + Husk (kg)' },
                { id: 'total-bran', type: 'number', label: 'Total Bran (kg)' },
                { id: 'total-dust', type: 'number', label: 'Total Dust (kg)' },
                { id: 'total-stones', type: 'number', label: 'Total Stones (kg)' },

                // KPIs
                { id: 'final-yield-ratio', type: 'number', label: 'Final Yield Ratio (%)', placeholder: '(Milled / Input) * 100', readOnly: false },
                { id: 'final-broken-percent', type: 'number', label: 'Final % Broken Rice', placeholder: '(Broken / Output) * 100', readOnly: false },

                // Sign off
                { id: 'supervisor-signoff', type: 'text', label: 'Supervisor Sign-off', placeholder: 'Name', required: true },
                { id: 'security-signoff', type: 'text', label: 'Security Sign-off', placeholder: 'Name', required: true },
                { id: 'closure-time', type: 'time', label: 'Timestamp Milling Closure', required: true }
            ]
        }
    ]
};
