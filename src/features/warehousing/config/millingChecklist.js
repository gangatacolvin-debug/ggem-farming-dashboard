/**
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const millingChecklistConfig = {
    id: 'milling-process',
    title: 'Milling Process Checklist with Hourly Progress',
    description: 'Standard Operating Procedure for Milling Operations with Hourly Tracking',

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
                { id: 'supervisor-name', type: 'text', label: 'Supervisor Name', autoPopulate: 'supervisorName', placeholder: 'Enter name', required: true },

                // ── NEW: Default variety for the shift ──
                {
                    id: 'default-variety',
                    type: 'select',
                    label: 'Rice Variety (Shift Default)',
                    options: [
                        { value: 'kayanjamalo', label: 'Kayanjamalo' },
                        { value: 'kilombero', label: 'Kilombero' }
                    ],
                    required: true
                },

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
                // ── REMOVED free-text rice-type; variety is now set in team-allocation ──
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
                { id: 'stacking-ready', type: 'checkbox', label: 'Stacking: Milled, Broken, Colorsorter, Dust, Stones organized', required: true },
                { id: 'qc-ready', type: 'checkbox', label: 'Quality Check: Monitoring ongoing (2)', required: true },
                { id: 'cleaner-ready', type: 'checkbox', label: 'Cleaner: Maintaining hygiene (1)', required: true }
            ]
        },
        {
            id: 'hourly-checks',
            title: 'Step 4: Hourly Progress Checks',
            icon: '⏱️',
            description: 'Record inputs and outputs every hour. Husk & Bran, Recovery % and Breakage % are calculated automatically.',
            fields: [
                {
                    id: 'hourlyLogs',
                    type: 'log-table',
                    label: 'Hourly Production Log',
                    // Tells LogTableField which field holds the shift default variety
                    defaultVarietyField: 'default-variety',
                    columns: [
                        // ── Time: auto-fills on row add ──
                        { key: 'time', label: 'Time', type: 'time', placeholder: 'HH:MM', autoFillTime: true },

                        // ── Variety: inherits shift default, overridable per row ──
                        {
                            key: 'variety',
                            label: 'Variety',
                            type: 'select',
                            options: [
                                { value: 'kayanjamalo', label: 'Kayanjamalo' },
                                { value: 'kilombero', label: 'Kilombero' }
                            ]
                        },

                        // ── Manual inputs ──
                        { key: 'unmilledBags', label: 'Unmilled Bags', type: 'number', placeholder: '0' },
                        { key: 'paddyFed', label: 'Paddy Fed (kg)', type: 'number', placeholder: '0' },
                        { key: 'milledRice', label: 'Milled (kg)', type: 'number', placeholder: '0' },
                        { key: 'brokenRice', label: 'Broken (kg)', type: 'number', placeholder: '0' },
                        { key: 'colorsorter', label: 'Colorsorter (kg)', type: 'number', placeholder: '0' },
                        { key: 'dustLiters', label: 'Dust w/ Listers (kg)', type: 'number', placeholder: '0' },
                        { key: 'stonesRice', label: 'Rice w/ Stones (kg)', type: 'number', placeholder: '0' },
                        { key: 'downtime', label: 'Downtime (min)', type: 'number', placeholder: '0' },

                        // ── Auto-calculated (readOnly) ──
                        { key: 'huskBran', label: 'Husk & Bran (kg)', type: 'number', readOnly: true, calculated: true, placeholder: '—' },
                        { key: 'recoveryPct', label: 'Recovery %', type: 'number', readOnly: true, calculated: true, placeholder: '—' },
                        { key: 'breakagePct', label: 'Breakage %', type: 'number', readOnly: true, calculated: true, placeholder: '—' },

                        { key: 'notes', label: 'Incidents', type: 'text', placeholder: 'Notes...' }
                    ]
                }
            ]
        },
        {
            id: 'post-milling',
            title: 'Step 5: Post-Milling Summary',
            icon: '📝',
            description: 'End of Batch/Shift Summary. Totals are calculated from hourly logs. Use override only to correct an error.',
            fields: [
                // ── All totals: read-only, summed from hourly logs ──
                // type: 'milling-summary' is a new field type handled in FieldRenderer
                {
                    id: 'milling-summary',
                    type: 'milling-summary',
                    label: 'Shift Totals & KPIs',
                    // Points to the hourly log field that is the data source
                    sourceField: 'hourlyLogs',
                    // Columns to sum from each row
                    totals: [
                        { key: 'paddyFed', label: 'Total Paddy Rice (kg)', required: true },
                        { key: 'milledRice', label: 'Total Milled Rice (kg)', required: true },
                        { key: 'brokenRice', label: 'Total Broken Rice (kg)', required: true },
                        { key: 'colorsorter', label: 'Total Colorsorter Rice (kg)' },
                        { key: 'dustLiters', label: 'Total Dust w/ Listers (kg)' },
                        { key: 'stonesRice', label: 'Total Rice w/ Stones (kg)' },
                        { key: 'huskBran', label: 'Total Husk & Bran (kg)' },
                        { key: 'downtime', label: 'Total Downtime (min)' }
                    ],
                    // KPIs derived from totals
                    kpis: [
                        {
                            key: 'yieldPct',
                            label: 'Overall Milling Recovery %',
                            formula: 'milledRice / paddyFed * 100'
                        },
                        {
                            key: 'breakagePct',
                            label: 'Overall Breakage %',
                            formula: 'brokenRice / paddyFed * 100'
                        }
                    ],
                    // Variety breakdown table
                    varietyBreakdown: true
                },

                // ── Sign off ──
                { id: 'supervisor-signoff', type: 'text', label: 'Supervisor Sign-off', autoPopulate: 'supervisorName', placeholder: 'Name', required: true },
                { id: 'security-signoff', type: 'text', label: 'Security Sign-off', placeholder: 'Name', required: true },
                { id: 'closure-time', type: 'time', label: 'Timestamp Milling Closure', required: true }
            ]
        }
    ]
};