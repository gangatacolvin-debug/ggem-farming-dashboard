/**
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */

import { GGEM_LOCATIONS } from '@/lib/locations';
export const hubTransferChecklistConfig = {
    id: 'hub-transfer-inspection',
    title: 'Hub Transfer & Inspection Checklist',
    sections: [
        {
            id: 'trip-info',
            title: 'Trip Information',
            fields: [
                { id: 'trip-id', type: 'text', label: 'Trip ID', placeholder: 'Enter Trip ID' },
                { id: 'trip-date', type: 'date', label: 'Date', placeholder: 'Select date' },
                { id: 'vehicle-reg', type: 'text', label: 'Vehicle Registration', placeholder: 'e.g., ABC 1234' },
                { id: 'driver-name', type: 'text', label: 'Driver Name', placeholder: 'Enter driver name' },
                { id: 'transfer-lead', type: 'text', label: 'Transfer Lead', placeholder: 'Enter name' },
                { id: 'security-lead', type: 'text', label: 'Security Lead', placeholder: 'Enter name' },
                { id: 'warehouse-attendant', type: 'text', label: 'Warehouse Attendant', placeholder: 'Enter name' },
                {
                    id: 'destination-hub',
                    type: 'select',  // You'll need to add this field type
                    label: 'Destination Hub',
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
            id: 'pre-departure',
            title: '1. Pre-Departure Confirmations (Head Office)',
            fields: [
                { id: 'truck-booking', type: 'checkbox', label: 'Truck booking confirmed (Security + Transfers Lead)' },
                { id: 'tyres-checked', type: 'checkbox', label: 'Tyres + spare tyre checked' },
                { id: 'bolts-checked', type: 'checkbox', label: 'Loose bolts (loading board, wheels, back axles) checked' },
                { id: 'reg-plates-visible', type: 'checkbox', label: 'Registration plates visible' },
                { id: 'truck-refueled', type: 'checkbox', label: 'Truck refueled (as per distance calculator)' },
                { id: 'fuel-amount', type: 'number', label: 'Fuel Amount (Liters)', placeholder: '0' },
                { id: 'workers-count', type: 'number', label: 'Number of Workers on Board', placeholder: '0' },
                { id: 'workers-list', type: 'text', label: 'Workers Names/IDs', placeholder: 'Enter names or IDs (comma separated)' },
                { id: 'equipment-list', type: 'text', label: 'Equipment/Apparatus Carried', placeholder: 'List equipment items' },
                { id: 'crew-confirmed', type: 'checkbox', label: 'Crew list confirmed with Security Lead' },
                { id: 'departure-time', type: 'time', label: 'Departure Time (Head Office)', placeholder: 'HH:MM' },
                { id: 'control-room-reported', type: 'checkbox', label: 'Reported to control room at departure' }
            ]
        },
        {
            id: 'journey-arrival',
            title: '2. Journey & Arrival at Hub',
            fields: [
                { id: 'gps-tracking', type: 'checkbox', label: 'Control room tracking vehicle on route (GPS)' },
                { id: 'arrival-time', type: 'time', label: 'Arrival Time at Hub', placeholder: 'HH:MM' },
                { id: 'arrival-reported', type: 'checkbox', label: 'Security at hub recorded arrival & reported to control room' },
                { id: 'warehouse-opened', type: 'checkbox', label: 'Transfer Lead + Security opened warehouse' },
                { id: 'stacks-inspected', type: 'checkbox', label: 'Stacks & warehouse condition inspected before loading' },
                { id: 'anomalies-found', type: 'checkbox', label: 'Any anomalies found? (damage, tampering, pests, etc.)' },
                { id: 'anomalies-details', type: 'text', label: 'If yes, describe anomalies', placeholder: 'Describe any issues found' },
                { id: 'anomalies-reported', type: 'checkbox', label: 'Anomalies reported immediately (if applicable)' }
            ]
        },
        {
            id: 'warehouse-loading',
            title: '3. Warehouse Checks & Loading',
            fields: [
                { id: 'moisture-testing', type: 'checkbox', label: 'Moisture testing conducted (min. 10 bags across 5 stacks)' },
                {
                    id: 'moistureLogs',
                    type: 'log-table',
                    label: 'Moisture Test Results',
                    columns: [
                        { key: 'stackNumber', label: 'Stack #', type: 'number', placeholder: '1' },
                        { key: 'bagNumber', label: 'Bag #', type: 'number', placeholder: '1' },
                        { key: 'moistureLevel', label: 'Moisture %', type: 'number', placeholder: '12' },
                        { key: 'status', label: 'Pass/Fail', type: 'text', placeholder: 'Pass' }
                    ]
                },
                { id: 'center-bags-checked', type: 'checkbox', label: 'Selected bags from center of stacks opened & checked during loading' },
                { id: 'camera-verification', type: 'checkbox', label: 'Control room verified loading via cameras' },
                { id: 'loading-start-time', type: 'time', label: 'Loading Start Time (Stopwatch)', placeholder: 'HH:MM' },
                { id: 'loading-end-time', type: 'time', label: 'Loading End Time', placeholder: 'HH:MM' },
                { id: 'bags-counted', type: 'number', label: 'Total Bags Loaded (Guards + Transfer Lead count)', placeholder: '334' },
                {
                    id: 'total-weight', type: 'number', label: 'Total Weight (kg)', placeholder: '15030',
                    validation: { max: 15030, message: 'Max 15 tonnes (334 × 45kg)' }
                },
                { id: 'overload-check', type: 'checkbox', label: 'Confirmed no overloading (Max: 334 bags × 45kg = 15 tonnes)' },
                { id: 'tarpaulin-covered', type: 'checkbox', label: 'Bags covered with tarpaulin' },
                { id: 'ropes-secured', type: 'checkbox', label: 'Load secured with ropes' }
            ]
        },
        {
            id: 'final-checks',
            title: '4. Final Verification & Departure',
            fields: [
                { id: 'final-bag-count', type: 'number', label: 'Final Bag Count Verification', placeholder: '334' },
                { id: 'discrepancy-check', type: 'checkbox', label: 'Any discrepancy in count?' },
                { id: 'discrepancy-details', type: 'text', label: 'If yes, explain discrepancy', placeholder: 'Describe discrepancy' },
                { id: 'security-signoff', type: 'text', label: 'Security Lead Sign-off', placeholder: 'Name & Signature' },
                { id: 'transfer-signoff', type: 'text', label: 'Transfer Lead Sign-off', placeholder: 'Name & Signature' },
                { id: 'warehouse-signoff', type: 'text', label: 'Warehouse Attendant Sign-off', placeholder: 'Name & Signature' },
                { id: 'departure-hub-time', type: 'time', label: 'Departure Time from Hub', placeholder: 'HH:MM' }
            ]
        },
        {
            id: 'summary',
            title: '5. Trip Summary',
            fields: [
                {
                    id: 'trip-summary',
                    type: 'summary',
                    label: 'Trip Performance Summary'
                }
            ]
        }
    ]
};