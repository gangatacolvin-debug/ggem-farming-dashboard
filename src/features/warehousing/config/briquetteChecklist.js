
/**
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const briquetteChecklistConfig = {
    id: 'briquette-production',
    title: 'Briquette Production Checklist',
    sections: [
        {
            id: 'shift-details',
            title: '1. Shift & Team Details',
            fields: [
                { id: 'date', type: 'text', label: 'Date', autoPopulate: 'date', readOnly: true },
                { id: 'shift', type: 'text', label: 'Shift / Batch #', autoPopulate: 'shift', readOnly: true },
                {
                    id: 'supervisorName',
                    type: 'text',
                    label: 'Supervisor Name',
                    autoPopulate: 'supervisorName',
                    placeholder: 'Enter Supervisor Name'
                },
                {
                    id: 'teamMembers',
                    type: 'textarea',
                    label: 'Team Responsible (Operators)',
                    placeholder: 'List all team members present...'
                }
            ]
        },
        {
            id: 'pre-op',
            title: '2. Pre-Operation & Safety Checks',
            fields: [
                { id: 'machine-clean', type: 'checkbox', label: 'Inspect briquette machine: Clean and dry' },
                { id: 'no-naked-wires', type: 'checkbox', label: 'Inspect briquette machine: Free from naked electrical wires' },
                { id: 'calibrated', type: 'checkbox', label: 'Inspect briquette machine: Properly calibrated' },
                { id: 'maintenance-date', type: 'date', label: 'Confirm machine maintenance is up to date (Last Service Date)', placeholder: 'Select date' },
                { id: 'work-area-safe', type: 'checkbox', label: 'Ensure work area is clean, dry, and free of hazards' },
                { id: 'pre-op-timestamp', type: 'text', label: 'Inspection Timestamp', autoPopulate: 'timestamp', readOnly: true }
            ]
        },
        {
            id: 'raw-material',
            title: '3. Raw Material Checks',
            fields: [
                {
                    id: 'husk-moisture',
                    type: 'number',
                    label: 'Husk moisture content (10-15%)',
                    validation: { min: 10, max: 15, warningMessage: 'Warning: Moisture outside optimal range (10-15%)' }
                },
                {
                    id: 'husk-consistency',
                    type: 'select',
                    label: 'Husk consistency',
                    options: [
                        { label: 'Uniform', value: 'uniform' },
                        { label: 'Non-Uniform', value: 'non-uniform' }
                    ]
                },
                { id: 'husk-weight', type: 'number', label: 'Initial Husk Batch Weight (kg)' },
                { id: 'raw-material-timestamp', type: 'text', label: 'Weighing Timestamp', autoPopulate: 'timestamp', readOnly: true }
            ]
        },
        {
            id: 'hourly-logs',
            title: '4. Hourly Production Logs',
            fields: [
                {
                    id: 'hourlyLogs',
                    type: 'log-table',
                    label: 'Hourly Production Monitor',
                    columns: [
                        { key: 'hour', label: 'Log Time', type: 'time', autoPopulate: 'currentTime' },
                        { key: 'briquettesProduced', label: 'Output (kg)', type: 'number', placeholder: '0' },
                        {
                            key: 'bagsPackaged',
                            label: 'Bags (Auto 50kg)',
                            type: 'number',
                            placeholder: '0',
                            readOnly: true,
                            computed: { operation: 'divide', source: 'briquettesProduced', factor: 50, round: true }
                        },
                        { key: 'rawHuskUsed', label: 'Husk Used (kg)', type: 'number', placeholder: '0' },
                        { key: 'fuelConsumption', label: 'Fuel (L)', type: 'number', placeholder: '0' },
                        { key: 'staffCount', label: 'Staff #', type: 'number', placeholder: '0' },
                        { key: 'notes', label: 'Performance Notes', type: 'text', placeholder: 'Issues/Downtime...' }
                    ]
                }
            ]
        },
        {
            id: 'production-process',
            title: '5. Production Process Monitoring',
            fields: [
                { id: 'machine-start', type: 'checkbox', label: 'Start machine and set temperature as per manual' },
                { id: 'monitor-density', type: 'checkbox', label: 'Monitor Density' },
                { id: 'monitor-shape', type: 'checkbox', label: 'Monitor Shape' },
                { id: 'monitor-size', type: 'checkbox', label: 'Monitor Size' },
                { id: 'setting-adjustments', type: 'textarea', label: 'Record any adjustments made to settings', placeholder: 'E.g., Adjusted temp to 250C...' },
                { id: 'process-timestamp', type: 'text', label: 'Monitoring Timestamp', autoPopulate: 'timestamp', readOnly: true }
            ]
        },
        {
            id: 'quality-control',
            title: '6. Quality Control',
            fields: [
                { id: 'ash-content', type: 'number', label: 'Test ash content of sample (%)' },
                { id: 'calorific-value', type: 'number', label: 'Check and record calorific value (MJ/kg)' },
                { id: 'qc-supervisor-signoff', type: 'text', label: 'Supervisor Review & Sign-off', placeholder: 'Supervisor Name' },
                { id: 'qc-timestamp', type: 'text', label: 'QC Timestamp', autoPopulate: 'timestamp', readOnly: true }
            ]
        },
        {
            id: 'safety-checks',
            title: '7. Safety Checks (Shift Start)',
            fields: [
                { id: 'ppe-gloves', type: 'checkbox', label: 'Fireproof Gloves' },
                { id: 'ppe-goggles', type: 'checkbox', label: 'Goggles' },
                { id: 'ppe-mask', type: 'checkbox', label: 'Mask' },
                { id: 'ppe-apron', type: 'checkbox', label: 'Apron' },
                { id: 'ppe-boots', type: 'checkbox', label: 'Safety Boots' },
                { id: 'fire-extinguishers', type: 'checkbox', label: 'Fire extinguishers accessible' },
                { id: 'emergency-exits', type: 'checkbox', label: 'Emergency exits clear' },
                { id: 'safety-timestamp', type: 'text', label: 'Safety Check Timestamp', autoPopulate: 'timestamp', readOnly: true }
            ]
        },
        {
            id: 'storage-packaging',
            title: '8. Storage & Packaging',
            fields: [
                { id: 'storage-dry', type: 'checkbox', label: 'Verify storage area is Dry' },
                { id: 'storage-ventilated', type: 'checkbox', label: 'Verify storage area is Ventilated' },
                { id: 'storage-pestfree', type: 'checkbox', label: 'Verify storage area is Pest-free' },
                { id: 'handling-care', type: 'checkbox', label: 'Handle briquettes carefully to prevent breakage' },
                { id: 'packaging-sealed', type: 'checkbox', label: 'Label, pack, and seal briquettes' },
                { id: 'final-weighing-log', type: 'log-table', label: 'Final Output Verification', columns: [{ key: 'batchId', label: 'Batch/Pallet ID' }, { key: 'weight', label: 'Total Weight (kg)' }] }
            ]
        },
        {
            id: 'shift-summary',
            title: '✅ Supervisor Final Review',
            fields: [
                { id: 'all-steps-completed', type: 'checkbox', label: 'Confirm all steps completed' },
                { id: 'logs-checked', type: 'checkbox', label: 'Check hourly logs (production, staff, material, fuel)' },
                { id: 'final-signoff', type: 'text', label: 'Sign off (Name)', placeholder: 'Supervisor Name' },
                { id: 'final-timestamp', type: 'text', label: 'Date & Time', autoPopulate: 'timestamp', readOnly: true }
            ]
        }
    ]
};
