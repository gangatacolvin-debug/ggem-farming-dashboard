export const DEPARTMENTS_CONFIG = [
    {
        id: 'warehouse-and-processing',
        name: 'Warehouse & Processing',
        icon: 'Factory', // Will map to a Lucide icon
        description: 'Milling, Briquette, Inventory & Logistics',
        color: 'blue',
        checklists: [
            'milling',
            'briquette',
            'hubcollection',
            'hub-collection-offloading',
            'hubtransfer',
            'hub-transfer-inspection',
            'warehouseclosing',
            'warehouse-closing-offloading',
            'warehouse-closing',
            'warehousemaintenance',
            'warehouse-maintenance',
            'warehouseinventory',
            'warehouse-inventory'
        ]
    },
    {
        id: 'data-and-field',
        name: 'Data and Field',
        icon: 'Users', // Will map to a Lucide icon
        description: 'Outreach, Engagement, Field Monitoring & QA',
        color: 'emerald',
        checklists: [
            'outreach-engagement',
            'sales-marketing',
            'field-monitoring-qa',
            'data-callcentre-oversight'
        ]
    },
    // Future departments can be added here:
    // {
    //     id: 'farming',
    //     name: 'Farming Operations',
    //     icon: 'Tractor',
    //     color: 'amber',
    //     checklists: ['land-prep', 'harvesting']
    // }
];

// Helper function to find a department by checklist ID
export const getDepartmentForChecklist = (checklistId) => {
    return DEPARTMENTS_CONFIG.find(dept => dept.checklists.includes(checklistId));
};
