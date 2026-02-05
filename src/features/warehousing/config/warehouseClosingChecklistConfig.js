/**
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */


import { GGEM_LOCATIONS } from '@/lib/locations';
export const warehouseClosingChecklistConfig = {
    id: 'warehouse-closing-offloading',
    title: 'Warehouse Closing & Hub Offloading Checklist',
    sections: [
        {
            id: 'trip-reference',
            title: 'Trip Reference Information',
            fields: [
                { id: 'trip-id', type: 'text', label: 'Trip ID', placeholder: 'Enter Trip ID', required: true },
                { id: 'trip-date', type: 'date', label: 'Date', placeholder: 'Select date' },
                { id: 'vehicle-reg', type: 'text', label: 'Vehicle Registration', placeholder: 'e.g., MK-1234' },
                { id: 'driver-name', type: 'text', label: 'Driver Name', placeholder: 'Enter driver name' },
                { id: 'transfer-lead', type: 'text', label: 'Transfer Lead', placeholder: 'Enter name' },
                { id: 'security-lead', type: 'text', label: 'Security Lead', placeholder: 'Enter name' },
                {
                    id: 'origin-hub',
                    type: 'select',
                    label: 'Origin Hub (Where loading happened)',
                    options: [
                        { value: 'dwangwa-hub', label: 'Dwangwa Hub' },
                        { value: 'linga-hub', label: 'Linga Hub' },
                        { value: 'suluwi-hub', label: 'Suluwi Hub' },
                        { value: 'salima-hub', label: 'Salima Hub' }
                    ],
                    required: true
                }
            ]
        },
        {
            id: 'warehouse-closing',
            title: 'Stage 4: Warehouse Closing & Site Inspection',
            fields: [
                { id: 'warehouse-locked', type: 'checkbox', label: 'Transfer Lead + Guards locked warehouse before leaving' },
                { id: 'perimeter-inspected', type: 'checkbox', label: 'Site perimeter inspected' },

                // Anomaly Detection Checkboxes
                { id: 'broken-fences', type: 'checkbox', label: 'Broken fences detected' },
                { id: 'damaged-windows-doors', type: 'checkbox', label: 'Damaged windows/doors detected' },
                { id: 'damaged-equipment', type: 'checkbox', label: 'Damaged or missing equipment detected' },

                { id: 'anomalies-details', type: 'text', label: 'Anomaly Details (if any)', placeholder: 'Describe any issues found...' },
                { id: 'anomalies-reported', type: 'checkbox', label: 'Anomalies reported to Site Manager' },
                { id: 'departure-reported', type: 'checkbox', label: 'Guard reported departure time to control room' },
                { id: 'departure-time-hub', type: 'time', label: 'Departure Time from Hub', placeholder: 'HH:MM' }
            ]
        },
        {
            id: 'arrival-offloading',
            title: 'Stage 5: Arrival at Main Site & Offloading',
            fields: [
                { id: 'arrival-time-hq', type: 'time', label: 'Arrival Time at Head Office', placeholder: 'HH:MM' },
                { id: 'bags-on-board', type: 'number', label: 'Number of Bags on Board (counted)', placeholder: '334' },
                { id: 'registered-odoo', type: 'checkbox', label: 'Bags registered in Odoo + Security log' },
                { id: 'bags-verified-offload', type: 'checkbox', label: 'Security + Transfers Lead jointly verified bags during offloading' },

                // Offloading Details
                { id: 'warehouse-location', type: 'text', label: 'Warehouse/Location where bags placed', placeholder: 'e.g., Warehouse A, Section 3' },
                { id: 'bags-offloaded', type: 'number', label: 'Number of Bags Offloaded', placeholder: '334' },
                { id: 'tonnes-offloaded', type: 'number', label: 'Total Weight Offloaded (kg)', placeholder: '15030' },

                // Discrepancy Check
                { id: 'bag-discrepancy', type: 'checkbox', label: 'Any discrepancy between bags on board vs offloaded?' },
                { id: 'discrepancy-details', type: 'text', label: 'Discrepancy Details (if any)', placeholder: 'Explain difference...' },

                // Transit Incidents
                { id: 'incidents-during-transit', type: 'text', label: 'Any incidents encountered during transit', placeholder: 'Describe incidents, delays, or issues...' },

                // Offloading Status
                {
                    id: 'offloading-status',
                    type: 'select',
                    label: 'Offloading Status',
                    options: [
                        { value: 'immediate', label: 'Immediate (Same Day)' },
                        { value: 'next-day', label: 'Next Day' }
                    ],
                    required: true
                },

                { id: 'offloading-completed-time', type: 'time', label: 'Offloading Completed Time', placeholder: 'HH:MM' }
            ]
        },
        {
            id: 'quality-verification',
            title: 'Quality & Condition Verification',
            fields: [
                {
                    id: 'conditionLogs',
                    type: 'log-table',
                    label: 'Stack Condition Assessment (Sample Checks)',
                    columns: [
                        { key: 'stackNumber', label: 'Stack #', type: 'number', placeholder: '1' },
                        { key: 'conditionScore', label: 'Condition (1-5)', type: 'number', placeholder: '5' },
                        { key: 'cleanlinessScore', label: 'Cleanliness (1-5)', type: 'number', placeholder: '5' },
                        { key: 'moistureLevel', label: 'Moisture %', type: 'number', placeholder: '12' },
                        { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Any observations...' }
                    ]
                }
            ]
        },
        {
            id: 'supervisor-signoff',
            title: 'Supervisor Sign-Off',
            fields: [
                { id: 'all-stages-completed', type: 'checkbox', label: 'All stages completed & logged', required: true },
                { id: 'supervisor-name', type: 'text', label: 'Supervisor Name', placeholder: 'Enter full name', required: true },
                { id: 'supervisor-signature', type: 'text', label: 'Supervisor Signature', placeholder: 'Type name to sign' },
                { id: 'signoff-date', type: 'date', label: 'Sign-off Date', placeholder: 'Select date' }
            ]
        },
        {
            id: 'summary',
            title: 'Trip Summary & KPIs',
            fields: [
                {
                    id: 'trip-summary',
                    type: 'summary',
                    label: 'Trip Performance Summary & Key Metrics'
                }
            ]
        }
    ]
};