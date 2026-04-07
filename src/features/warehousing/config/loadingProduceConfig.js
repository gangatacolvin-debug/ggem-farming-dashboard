/**
 * Loading Produce for Dispatch - Complete Checklist
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const loadingDispatchChecklistConfig = {
    id: 'loading-produce-dispatch',
    title: 'Loading Produce for Dispatch Checklist',
    description: 'Complete workflow: Pre-Loading → Produce Verification → Loading → Securing → Departure → Documentation',

    // Location verification points
    locationCheckpoints: {
        'loading-process': 'main-warehouse'  // Must be at warehouse for loading
    },

    sections: [
        {
            id: 'dispatch-header',
            title: 'Dispatch Header',
            icon: '📋',
            description: 'Record dispatch details before starting any stage',
            estimatedDuration: 5, // minutes
            requiresLocation: false,
            fields: [
                { id: 'dispatch-id', type: 'text', label: 'Dispatch ID', placeholder: 'Auto-generated', readOnly: true },
                { id: 'date', type: 'date', label: 'Date', required: true },
                { id: 'truck-reg', type: 'text', label: 'Truck Registration', placeholder: 'e.g., MK-1234', required: true },
                { id: 'driver', type: 'text', label: 'Driver Name', placeholder: 'Enter driver name', required: true },
                { id: 'destination', type: 'text', label: 'Destination', placeholder: 'Enter destination', required: true },
                { id: 'client-buyer', type: 'text', label: 'Client / Buyer', placeholder: 'Enter client or buyer name', required: true }
            ]
        },

        {
            id: 'pre-loading',
            title: 'Stage 1 – Pre-Loading Preparations',
            icon: '🔍',
            description: 'Confirm dispatch order, inspect truck, brief crew before loading begins',
            estimatedDuration: 15, // minutes
            requiresLocation: false,
            fields: [
                // Dispatch Order
                { id: 'dispatch-order-confirmed', type: 'checkbox', label: 'Confirm dispatch order & documentation (buyer, destination, quantities, variety)' },

                // Truck Inspection
                { id: 'tyres-checked', type: 'checkbox', label: 'Tyres and spare tyre checked' },
                { id: 'bolts-axles-secure', type: 'checkbox', label: 'Bolts / axles secure' },
                { id: 'cargo-space-clean', type: 'checkbox', label: 'Cargo space clean, dry, and pest-free' },
                { id: 'security-wh-inspect', type: 'checkbox', label: 'Security & Warehouse Lead inspected truck and recorded findings' },
                { id: 'fuel-confirmed', type: 'checkbox', label: 'Fuel status confirmed (per distance requirement)' },

                // Crew Details
                { id: 'warehouse-lead', type: 'text', label: 'Warehouse Lead', placeholder: 'Enter name', required: true },
                { id: 'security-lead', type: 'text', label: 'Security Lead', placeholder: 'Enter name', required: true },
                { id: 'staff-assigned', type: 'text', label: 'Staff Assigned (names & roles)', placeholder: 'Enter names and roles' },
                { id: 'guards-ggem', type: 'number', label: 'GGEM Security Guards (count)', placeholder: '0' },
                { id: 'guards-g4s', type: 'number', label: 'G4S Security Guards (count)', placeholder: '0' },

                // Safety Briefing
                { id: 'safety-briefing-done', type: 'checkbox', label: 'Safety briefing conducted: PPE check (helmets, gloves, boots, vests), safe lifting, route clearance', required: true },
                { id: 'briefing-time', type: 'time', label: 'Briefing Timestamp', placeholder: 'HH:MM' }
            ]
        },

        {
            id: 'produce-verification',
            title: 'Stage 2 – Produce Verification',
            icon: '🌾',
            description: 'Confirm produce details and inspect storage stacks before loading',
            estimatedDuration: 20, // minutes
            requiresLocation: false,
            fields: [
                // Produce Details
                { id: 'variety', type: 'text', label: 'Variety', placeholder: 'e.g., Kilombero', required: true },
                { id: 'bag-weight', type: 'number', label: 'Bag Weight (kg)', placeholder: '45', required: true },
                { id: 'moisture-pct', type: 'number', label: 'Moisture %', placeholder: '12', required: true },
                { id: 'inventory-cross-checked', type: 'checkbox', label: 'Cross-checked against dispatch documentation & inventory records' },

                // Stack Inspection
                { id: 'bag-integrity', type: 'checkbox', label: 'Bag integrity checked (no tears, damage)' },
                { id: 'proper-stacking', type: 'checkbox', label: 'Proper stacking confirmed' },
                { id: 'pests-spillage-free', type: 'checkbox', label: 'No signs of pests or spillage' }
            ]
        },

        {
            id: 'loading-process',
            title: 'Stage 3 – Loading Process',
            icon: '🚛',
            description: 'Load produce onto truck, monitor bag handling, and verify counts',
            estimatedDuration: 180, // minutes
            requiresLocation: true,
            locationMessage: 'You must be at the warehouse to complete this section',
            fields: [
                // Timing
                { id: 'loading-start-time', type: 'time', label: 'Loading Start Time', placeholder: 'HH:MM', required: true },
                { id: 'loading-end-time', type: 'time', label: 'Loading End Time', placeholder: 'HH:MM', required: true },

                // Monitoring
                { id: 'bag-handling-ok', type: 'checkbox', label: 'Bag handling monitored (no dragging or dropping)' },
                { id: 'correct-equipment', type: 'checkbox', label: 'Correct equipment used (trolley jacks, conveyors, forklifts)' },

                // Counts
                { id: 'bags-loaded', type: 'number', label: 'Total Bags Loaded', placeholder: '334', required: true },
                { id: 'total-weight', type: 'number', label: 'Total Weight (kg)', placeholder: '15030' },
                { id: 'bags-loaded-per-hour', type: 'number', label: 'Bags Loaded per Hour', placeholder: '0' },

                // Verification
                { id: 'bag-count-matches', type: 'checkbox', label: 'Bag count matches dispatch order', required: true },
                { id: 'security-cross-verify', type: 'checkbox', label: 'Security cross-verified bag count at loading point', required: true },

                // Damaged Bags
                { id: 'damaged-bags-count', type: 'number', label: 'Damaged / Rejected Bags (count)', placeholder: '0' },
                { id: 'damage-reason', type: 'text', label: 'Damage Reason (if any)', placeholder: 'Describe reason...' }
            ]
        },

        {
            id: 'securing-load',
            title: 'Stage 4 – Securing Load & Final Checks',
            icon: '🔒',
            description: 'Secure the load and conduct final truck inspection before departure',
            estimatedDuration: 15, // minutes
            requiresLocation: false,
            fields: [
                { id: 'tarpaulin-covered', type: 'checkbox', label: 'Load covered with tarpaulin', required: true },
                { id: 'ropes-secured', type: 'checkbox', label: 'Load secured with ropes / straps', required: true },

                // Final Inspection
                { id: 'cargo-secure-final', type: 'checkbox', label: 'Cargo secure (Warehouse Lead + Security)' },
                { id: 'no-loose-ropes', type: 'checkbox', label: 'No loose ropes or tarps' },
                { id: 'truck-departure-ready', type: 'checkbox', label: 'Truck ready for departure' }
            ]
        },

        {
            id: 'departure-handover',
            title: 'Stage 5 – Departure & Handover',
            icon: '🚀',
            description: 'Log departure, hand over documents to driver, and notify control room',
            estimatedDuration: 10, // minutes
            requiresLocation: false,
            fields: [
                { id: 'departure-time', type: 'time', label: 'Departure Time', placeholder: 'HH:MM', required: true },
                { id: 'docs-handed-to-driver', type: 'checkbox', label: 'Transfer documents handed to driver (dispatch note, delivery order, waybill)', required: true },
                { id: 'control-room-notified', type: 'checkbox', label: 'Destination & load details reported to Control Room', required: true },
                { id: 'staff-guards-accompanying', type: 'number', label: 'Staff / Guards Accompanying (count)', placeholder: '0' }
            ]
        },

        {
            id: 'documentation-closure',
            title: 'Stage 6 – Documentation & Closure',
            icon: '📁',
            description: 'Record dispatch in Odoo, log any incidents, and secure the warehouse',
            estimatedDuration: 10, // minutes
            requiresLocation: false,
            fields: [
                { id: 'recorded-in-odoo', type: 'checkbox', label: 'Dispatch details entered into Odoo / CRM (bags loaded, tonnes, staff used, issues noted)', required: true },
                { id: 'incidents-text', type: 'text', label: 'Incidents / Issues Encountered', placeholder: 'Describe any issues...' },
                { id: 'warehouse-locked', type: 'checkbox', label: 'Warehouse locked and secured', required: true },
                { id: 'supervisor-signoff', type: 'text', label: 'Supervisor Sign-off', placeholder: 'Name & Signature', required: true },
                { id: 'closure-time', type: 'time', label: 'Warehouse Closure Timestamp', placeholder: 'HH:MM' }
            ]
        },

        {
            id: 'summary',
            title: 'Dispatch Summary & KPIs',
            icon: '📊',
            description: 'Complete dispatch overview and performance metrics',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                {
                    id: 'dispatch-summary',
                    type: 'summary',
                    label: 'Complete Dispatch Performance Summary'
                }
            ]
        }
    ]
};