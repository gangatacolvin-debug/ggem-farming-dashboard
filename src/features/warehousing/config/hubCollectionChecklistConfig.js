/**
 * Hub Collection & Offloading - Complete Roundtrip Checklist
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const hubCollectionChecklistConfig = {
    id: 'hub-collection-offloading',
    title: 'Hub Collection & Offloading Checklist',
    description: 'Complete workflow: Depart HQ → Travel to Hub → Load → Return → Offload',

    // Location verification points
    locationCheckpoints: {
        'hub-transfer-loading': 'originHub',  // Must be at hub for this section
        'offloading-hq': 'main-warehouse'     // Must be at HQ for this section
    },

    sections: [
        {
            id: 'pre-departure',
            title: 'Part 1: Pre-Departure Checks (Head Office)',
            icon: '🏢',
            description: 'Complete all checks before departing to hub',
            estimatedDuration: 15, // minutes
            requiresLocation: false,
            fields: [
                { id: 'trip-id', type: 'text', label: 'Trip ID', placeholder: 'Auto-generated', readOnly: true },
                { id: 'departure-date', type: 'date', label: 'Departure Date', required: true },
                { id: 'vehicle-reg', type: 'text', label: 'Vehicle Registration', placeholder: 'e.g., MK-1234', required: true },
                { id: 'driver-name', type: 'text', label: 'Driver Name', placeholder: 'Enter driver name', required: true },
                { id: 'transfer-lead', type: 'text', label: 'Transfer Lead', placeholder: 'Enter name', required: true },
                { id: 'security-lead', type: 'text', label: 'Security Lead', placeholder: 'Enter name', required: true },

                // Destination
                {
                    id: 'destination-hub',
                    type: 'select',
                    label: 'Destination Hub',
                    options: [
                        { value: 'dwangwa-hub', label: 'Dwangwa Hub' },
                        { value: 'linga-hub', label: 'Linga Hub' },
                        { value: 'suluwi-hub', label: 'Suluwi Hub' },
                        { value: 'salima-hub', label: 'Salima Hub' }
                    ],
                    required: true
                },

                // Vehicle Inspection
                { id: 'truck-booking-confirmed', type: 'checkbox', label: 'Truck booking confirmed (Security + Transfers Lead)' },
                { id: 'tyres-checked', type: 'checkbox', label: 'Tyres + spare tyre checked' },
                { id: 'bolts-checked', type: 'checkbox', label: 'Loose bolts (loading board, wheels, back axles) checked' },
                { id: 'reg-plates-visible', type: 'checkbox', label: 'Registration plates visible' },
                { id: 'truck-refueled', type: 'checkbox', label: 'Truck refueled (as per distance calculator)' },

                // Crew Details
                { id: 'fuel-amount', type: 'number', label: 'Fuel Amount (Liters)', placeholder: '0' },
                { id: 'workers-count', type: 'number', label: 'Number of Workers on Board', placeholder: '0' },
                { id: 'workers-list', type: 'text', label: 'Workers Names/IDs', placeholder: 'Enter names (comma separated)' },
                { id: 'equipment-list', type: 'text', label: 'Equipment/Apparatus Carried', placeholder: 'List equipment' },
                { id: 'crew-confirmed', type: 'checkbox', label: 'Crew list confirmed with Security Lead' },

                // Departure
                { id: 'departure-time-hq', type: 'time', label: 'Departure Time (Head Office)', placeholder: 'HH:MM', required: true },
                { id: 'control-room-reported-departure', type: 'checkbox', label: 'Reported to control room at departure' }
            ]
        },

        {
            id: 'hub-transfer-loading',
            title: 'Part 2: Hub Transfer, Loading & Warehouse Closing',
            icon: '🚛',
            description: 'Arrive at hub, inspect, load bags, and close warehouse',
            estimatedDuration: 240, // minutes
            requiresLocation: true,
            locationMessage: 'You must be at the assigned hub to complete this section',
            fields: [
                // Journey & Arrival
                { id: 'gps-tracking-active', type: 'checkbox', label: 'GPS tracking active during journey' },
                { id: 'arrival-time-hub', type: 'time', label: 'Arrival Time at Hub', placeholder: 'HH:MM', required: true },
                { id: 'arrival-reported', type: 'checkbox', label: 'Security at hub recorded arrival & reported to control room' },

                // Warehouse Opening & Inspection
                { id: 'warehouse-opened', type: 'checkbox', label: 'Transfer Lead + Security opened warehouse' },
                { id: 'stacks-inspected', type: 'checkbox', label: 'Stacks & warehouse condition inspected before loading' },
                { id: 'anomalies-found', type: 'checkbox', label: 'Any anomalies found? (damage, tampering, pests, etc.)' },
                { id: 'anomalies-details', type: 'text', label: 'If yes, describe anomalies', placeholder: 'Describe issues found' },
                { id: 'anomalies-reported', type: 'checkbox', label: 'Anomalies reported immediately (if applicable)' },

                // Moisture Testing
                { id: 'moisture-testing-done', type: 'checkbox', label: 'Moisture testing conducted (min. 10 bags across 5 stacks)' },
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

                // Loading Process
                { id: 'center-bags-checked', type: 'checkbox', label: 'Selected bags from center of stacks opened & checked during loading' },
                { id: 'camera-verification', type: 'checkbox', label: 'Control room verified loading via cameras' },
                { id: 'loading-start-time', type: 'time', label: 'Loading Start Time', placeholder: 'HH:MM' },
                { id: 'loading-end-time', type: 'time', label: 'Loading End Time', placeholder: 'HH:MM' },
                { id: 'bags-loaded', type: 'number', label: 'Total Bags Loaded', placeholder: '334', required: true },
                { id: 'total-weight', type: 'number', label: 'Total Weight (kg)', placeholder: '15030' },
                { id: 'overload-check', type: 'checkbox', label: 'Confirmed no overloading (Max: 334 bags × 45kg = 15 tonnes)' },
                { id: 'tarpaulin-covered', type: 'checkbox', label: 'Bags covered with tarpaulin' },
                { id: 'ropes-secured', type: 'checkbox', label: 'Load secured with ropes' },

                // Warehouse Closing (PART OF HUB TRANSFER)
                { id: 'warehouse-locked', type: 'checkbox', label: 'Transfer Lead + Guards locked warehouse before leaving', required: true },
                { id: 'perimeter-inspected', type: 'checkbox', label: 'Site perimeter inspected' },
                { id: 'broken-fences', type: 'checkbox', label: 'Broken fences detected' },
                { id: 'damaged-windows-doors', type: 'checkbox', label: 'Damaged windows/doors detected' },
                { id: 'damaged-equipment', type: 'checkbox', label: 'Damaged or missing equipment detected' },
                { id: 'site-anomalies-details', type: 'text', label: 'Site Anomaly Details (if any)', placeholder: 'Describe issues...' },
                { id: 'site-anomalies-reported', type: 'checkbox', label: 'Site anomalies reported to Site Manager' },

                // Sign-offs
                { id: 'security-signoff', type: 'text', label: 'Security Lead Sign-off', placeholder: 'Name & Signature' },
                { id: 'transfer-signoff', type: 'text', label: 'Transfer Lead Sign-off', placeholder: 'Name & Signature' },
                { id: 'warehouse-attendant-signoff', type: 'text', label: 'Warehouse Attendant Sign-off', placeholder: 'Name & Signature' }
            ]
        },

        {
            id: 'return-journey',
            title: 'Part 3: Return Journey to HQ',
            icon: '🔄',
            description: 'Departure from hub and journey back to head office',
            estimatedDuration: 180, // minutes
            requiresLocation: false,
            fields: [
                { id: 'departure-time-hub', type: 'time', label: 'Departure Time from Hub', placeholder: 'HH:MM', required: true },
                { id: 'departure-reported-control', type: 'checkbox', label: 'Departure reported to control room' },
                { id: 'estimated-arrival-hq', type: 'time', label: 'Estimated Arrival at HQ', placeholder: 'HH:MM' },
                { id: 'journey-incidents', type: 'text', label: 'Any incidents during journey?', placeholder: 'Describe any issues...' }
            ]
        },

        {
            id: 'offloading-hq',
            title: 'Part 4: Offloading at Head Office',
            icon: '📦',
            description: 'Arrival at HQ, verification, and offloading process',
            estimatedDuration: 120, // minutes
            requiresLocation: true,
            locationMessage: 'You must be at Head Office to complete offloading',
            fields: [
                // Arrival
                { id: 'arrival-time-hq', type: 'time', label: 'Arrival Time at Head Office', placeholder: 'HH:MM', required: true },

                // Eligibility Check
                {
                    id: 'arrival-before-cutoff',
                    type: 'select',
                    label: 'Arrival Status',
                    options: [
                        { value: 'before-1600', label: 'Arrived before 16:00 (Eligible for same-day offloading)' },
                        { value: 'after-1600', label: 'Arrived after 16:00 (Postponed to next day)' }
                    ],
                    required: true
                },

                // Documentation
                { id: 'bags-on-board', type: 'number', label: 'Bags on Board (Counted)', placeholder: '334', required: true },
                { id: 'variety-confirmed', type: 'text', label: 'Rice Variety', placeholder: 'e.g., Kilombero' },
                { id: 'moisture-content', type: 'number', label: 'Moisture Content %', placeholder: '12' },
                { id: 'documents-verified', type: 'checkbox', label: 'All documents verified (origin, variety, moisture, truck, driver, dispatcher)' },

                // Vehicle & Cargo Inspection
                { id: 'cargo-secured-intact', type: 'checkbox', label: 'Cargo secured (tarpaulin, ropes intact)' },
                { id: 'no-vehicle-damage', type: 'checkbox', label: 'No visible tent or vehicle damage' },
                { id: 'inspection-notes', type: 'text', label: 'Inspection Notes', placeholder: 'Record any observations...' },

                // Equipment Readiness
                { id: 'cranes-ready', type: 'checkbox', label: 'Cranes ready & in good condition' },
                { id: 'conveyors-ready', type: 'checkbox', label: 'Conveyors ready & in good condition' },
                { id: 'trolley-jacks-ready', type: 'checkbox', label: 'Trolley jacks ready & in good condition' },
                { id: 'forklifts-ready', type: 'checkbox', label: 'Forklifts ready & in good condition' },

                // Storage Area Check
                { id: 'storage-dry', type: 'checkbox', label: 'Storage area is dry' },
                { id: 'storage-clean', type: 'checkbox', label: 'Free of oils/chemicals' },
                { id: 'no-hazardous-substances', type: 'checkbox', label: 'No hazardous substances present' },
                { id: 'storage-approved', type: 'checkbox', label: 'Storage area approved as suitable for rice' },

                // Safety Briefing
                { id: 'safety-briefing-conducted', type: 'checkbox', label: 'Safety briefing conducted with all offloading workers', required: true },
                { id: 'ppe-confirmed', type: 'checkbox', label: 'PPE confirmed (hard hats, work suits, gloves, boots)' },
                { id: 'equipment-use-explained', type: 'checkbox', label: 'Safe use of equipment explained' },
                { id: 'obstacles-cleared', type: 'checkbox', label: 'Obstacles cleared from offloading route' },
                { id: 'briefing-time', type: 'time', label: 'Safety Briefing Time', placeholder: 'HH:MM' },

                // Offloading Process
                { id: 'offloading-start-time', type: 'time', label: 'Offloading Start Time', placeholder: 'HH:MM' },
                { id: 'bags-offloaded', type: 'number', label: 'Total Bags Offloaded', placeholder: '334', required: true },
                { id: 'weight-offloaded', type: 'number', label: 'Total Weight Offloaded (kg)', placeholder: '15030' },
                { id: 'handling-losses', type: 'number', label: 'Handling Losses (kg)', placeholder: '0' },
                { id: 'damaged-bags-count', type: 'number', label: 'Number of Damaged Bags', placeholder: '0' },
                { id: 'offloading-end-time', type: 'time', label: 'Offloading End Time', placeholder: 'HH:MM' },

                // Final Inspection
                { id: 'damaged-bags-inspected', type: 'checkbox', label: 'Damaged bags inspected' },
                { id: 'stacking-proper', type: 'checkbox', label: 'Stacking done properly' },
                { id: 'spillage-check', type: 'checkbox', label: 'Spillage checked' },
                { id: 'condition-score', type: 'number', label: 'Overall Condition Score (1-10)', placeholder: '8', min: 1, max: 10 },
                { id: 'condition-notes', type: 'text', label: 'Condition Notes', placeholder: 'Record any issues...' },

                // Documentation & Closure
                { id: 'registered-odoo', type: 'checkbox', label: 'Registered in Odoo system', required: true },
                { id: 'warehouse-location', type: 'text', label: 'Warehouse Location (where bags placed)', placeholder: 'e.g., Warehouse A, Section 2', required: true },
                { id: 'incidents-logged', type: 'text', label: 'Incidents/Issues Encountered', placeholder: 'Describe any issues...' },

                {
                    id: 'offloading-status',
                    type: 'select',
                    label: 'Offloading Status',
                    options: [
                        { value: 'immediate', label: 'Completed Immediately (Same Day)' },
                        { value: 'next-day', label: 'Postponed to Next Day' }
                    ],
                    required: true
                },

                // Security Closure
                { id: 'warehouse-doors-locked', type: 'checkbox', label: 'Warehouse doors locked' },
                { id: 'keys-returned', type: 'checkbox', label: 'Keys returned to security' },
                { id: 'cameras-checked', type: 'checkbox', label: 'Security cameras checked' },
                { id: 'closure-time', type: 'time', label: 'Warehouse Closure Time', placeholder: 'HH:MM' }
            ]
        },

        {
            id: 'summary',
            title: 'Trip Summary & KPIs',
            icon: '📊',
            description: 'Complete trip overview and performance metrics',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                {
                    id: 'trip-summary',
                    type: 'summary',
                    label: 'Complete Trip Performance Summary'
                }
            ]
        }
    ]
};