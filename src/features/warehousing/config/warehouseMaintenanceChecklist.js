/**
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const warehouseMaintenanceChecklistConfig = {
    id: 'warehouse-maintenance',
    title: 'Warehouse Maintenance Checklist',
    description: 'Routine maintenance and inspection of warehouse facilities',

    // Maintenance can happen at any warehouse/hub
    locationCheckpoints: {},

    sections: [
        {
            id: 'details',
            title: 'Maintenance Details',
            icon: '📋',
            description: 'Record maintenance session details',
            fields: [
                {
                    id: 'warehouse-id',
                    type: 'select',
                    label: 'Warehouse Name/ID',
                    options: [
                        { value: 'main-warehouse', label: 'Main Warehouse' },
                        { value: 'dwangwa-hub', label: 'Dwangwa Hub' },
                        { value: 'linga-hub', label: 'Linga Hub' },
                        { value: 'suluwi-hub', label: 'Suluwi Hub' },
                        { value: 'salima-hub', label: 'Salima Hub' }
                    ],
                    required: true
                },
                { id: 'date', type: 'date', label: 'Date', required: true },
                { id: 'maintenance-lead', type: 'text', label: 'Maintenance Lead', placeholder: 'Enter name', required: true },
                { id: 'security-on-duty', type: 'text', label: 'Security On Duty', placeholder: 'Enter name', required: true }
            ]
        },
        {
            id: 'general-cleanliness',
            title: 'Stage 1: General Cleanliness',
            icon: '🧹',
            description: 'Floors, equipment, and waste management',
            fields: [
                { id: 'floors-swept', type: 'checkbox', label: 'Sweep floors, remove dust, debris, and spilled grains' },
                { id: 'waste-bins-emptied', type: 'checkbox', label: 'Confirm waste bins are emptied and sealed' },
                { id: 'equipment-wiped', type: 'checkbox', label: 'Wipe equipment surfaces, conveyor belts, and pallet areas' },
                { id: 'aisles-clear', type: 'checkbox', label: 'Aisles clear and marked paths unobstructed' },
                { id: 'walls-ceilings-clean', type: 'checkbox', label: 'Walls and ceilings free of cobwebs/dust buildup' },
                { id: 'cleaning-time', type: 'time', label: 'Timestamp cleaning completed', required: true }
            ]
        },
        {
            id: 'pest-control',
            title: 'Stage 2: Pest Control',
            icon: '🐀',
            description: 'Inspection for rodents and insects',
            fields: [
                { id: 'signs-of-pests', type: 'checkbox', label: 'Inspect for signs of rodents/insects (droppings, gnaw marks)' },
                { id: 'bait-stations-checked', type: 'checkbox', label: 'Check bait stations/traps – record conditions' },
                { id: 'perimeter-water-checked', type: 'checkbox', label: 'Confirm perimeter is free of stagnant water and garbage' },
                { id: 'entry-points-checked', type: 'checkbox', label: 'Inspect roof, windows, and doors for pest entry points' },
                { id: 'infestations-reported', type: 'checkbox', label: 'Report infestations immediately to Warehouse Lead + Security' },
                { id: 'pest-control-time', type: 'time', label: 'Timestamp pest control check completed', required: true }
            ]
        },
        {
            id: 'climate-monitoring',
            title: 'Stage 3: Moisture & Climate Monitoring',
            icon: '🌡️',
            description: 'Humidity, temperature, and moisture checks',
            fields: [
                { id: 'humidity-level', type: 'number', label: 'Measure ambient warehouse humidity (%)', placeholder: 'Target: 50-60%' },
                { id: 'temperature-level', type: 'number', label: 'Check temperature at multiple points (°C)', placeholder: 'Range: 20-30°C' },
                { id: 'moisture-samples-collected', type: 'checkbox', label: 'Test moisture content of sample bags (min 10 bags)' },
                { id: 'average-moisture', type: 'number', label: 'Record average moisture %', placeholder: 'Range: 10-15%' },
                { id: 'results-logged', type: 'checkbox', label: 'Log results into CRM (system alert if outside range)' },
                { id: 'monitoring-time', type: 'time', label: 'Timestamp monitoring completed', required: true }
            ]
        },
        {
            id: 'equipment-safety',
            title: 'Stage 4: Equipment & Safety Checks',
            icon: '🦺',
            description: 'Machinery status and safety gear',
            fields: [
                { id: 'machinery-inspected', type: 'checkbox', label: 'Inspect forklifts, pallet jacks, conveyors, and dryers' },
                { id: 'fire-extinguishers-checked', type: 'checkbox', label: 'Confirm fire extinguishers are present and within service dates' },
                { id: 'emergency-exits-clear', type: 'checkbox', label: 'Emergency exits clear and unlocked' },
                { id: 'lighting-functional', type: 'checkbox', label: 'Lighting functional across all aisles' },
                { id: 'cameras-active', type: 'checkbox', label: 'Security cameras powered and positioned correctly' },
                { id: 'ppe-available', type: 'checkbox', label: 'PPE (helmets, gloves, boots) available for staff' },
                { id: 'safety-time', type: 'time', label: 'Timestamp equipment inspection completed', required: true }
            ]
        },
        {
            id: 'perimeter-structure',
            title: 'Stage 5: Perimeter & Structure',
            icon: '🏗️',
            description: 'Building integrity and external grounds',
            fields: [
                { id: 'walls-roof-checked', type: 'checkbox', label: 'Inspect external walls, windows, and roof for damage/leaks' },
                { id: 'fence-checked', type: 'checkbox', label: 'Check perimeter fence for integrity' },
                { id: 'grounds-maintained', type: 'checkbox', label: 'Grass, weeds, and foliage cut short (fire break maintained)' },
                { id: 'drains-clear', type: 'checkbox', label: 'Drains and gutters clear' },
                { id: 'utilities-functional', type: 'checkbox', label: 'Staff housing/office utilities functional' },
                { id: 'structure-time', type: 'time', label: 'Timestamp structural inspection completed', required: true }
            ]
        },
        {
            id: 'closure',
            title: 'Stage 6: Documentation & Closure',
            icon: '📝',
            description: 'Final reporting and sign-off',
            fields: [
                { id: 'findings-recorded', type: 'checkbox', label: 'Record all findings and maintenance actions in CRM', required: true },
                { id: 'chemical-use-logged', type: 'text', label: 'Log pest control replacements/chemical use', placeholder: 'N/A if none' },
                { id: 'repairs-reported', type: 'text', label: 'Report anomalies or repairs required', placeholder: 'Describe issues...' },
                { id: 'supervisor-signoff', type: 'text', label: 'Supervisor Name (Sign-off)', required: true },
                { id: 'closure-time', type: 'time', label: 'Timestamp closure', required: true }
            ]
        }
    ]
};
