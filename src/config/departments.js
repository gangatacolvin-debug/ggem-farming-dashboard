import { AGGREGATION_TASK_ASSIGNEE_ROLES } from './fieldPortal';

export const DEPARTMENTS_CONFIG = [
    {
        id: 'warehouse',
        name: 'Warehouse & Processing',
        icon: 'Factory', // Will map to a Lucide icon
        description: 'Milling, Briquette, Inventory & Logistics',
        color: 'blue',
        /** Roles assignable by warehouse managers in Task Management */
        taskAssigneeRoles: ['supervisor', 'warehouse-supervisor'],
        checklists: [
            'milling',
            'briquette',
            'hubcollection',
            'hubtransfer',
            'warehouseclosing',
            'warehousemaintenance',
            'warehouseinventory',
            'loading',
        ],
        /** Human-readable labels for the task management UI */
        checklistLabels: {
            'milling':            'Milling Checklist',
            'briquette':          'Briquette Checklist',
            'hubcollection':      'Hub Collection & Offloading Checklist',
            'hubtransfer':        'Hub Transfer Checklist',
            'warehouseclosing':   'Warehouse Closing & Offloading Checklist',
            'warehousemaintenance': 'Warehouse Maintenance Checklist',
            'warehouseinventory': 'Warehouse Inventory Checklist',
            'loading':            'Loading & Dispatch Checklist',
        },
    },
    {
        id: 'data-field',
        name: 'Data and Field',
        icon: 'Users', // Will map to a Lucide icon
        description: 'Outreach, Engagement, Field Monitoring & QA',
        color: 'emerald',
        /** Keep explicit for clarity and future expansion */
        taskAssigneeRoles: ['supervisor'],
        checklists: [
            'outreach-engagement',
            'sales-marketing',
            'field-monitoring-qa',
            'data-callcentre-oversight'
        ]
    },

    {
        id: 'aggregation',
        name: 'Aggregation',
        icon: 'Users', // Will map to a Lucide icon
        description: 'Pre-Aggregation Setup, Weighing, Quality Control, Stock Receiving, and End-of-Day',
        color: 'emerald',
        /** Must match `checklistType` / CHECKLIST_CONFIGS keys (TaskDetail, etc.) */
        checklists: [
            'pre-aggregation-setup',
            'aggregation-quality-control',
            'aggregation-weighing-recording',
            'aggregation-warehouse-receiving',
            'aggregation-end-of-day'
        ],
        /** Short titles for manager task UI */
        checklistLabels: {
            'pre-aggregation-setup': 'Pre-Aggregation Setup',
            'aggregation-quality-control': 'Quality Control & Grading',
            'aggregation-weighing-recording': 'Weighing & Recording',
            'aggregation-warehouse-receiving': 'Warehouse & Stock Receiving',
            'aggregation-end-of-day': 'End of Day Reconciliation'
        },
        /** Same list as field-portal assignees (see fieldPortal.js). */
        taskAssigneeRoles: [...AGGREGATION_TASK_ASSIGNEE_ROLES]
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

/** Maps checklist config `id` (on submissions) → task `checklistType` keys in DEPARTMENTS_CONFIG */
export const CHECKLIST_TYPE_ALIASES = {
    'milling-process': 'milling',
    'briquette-production': 'briquette',
    'hub-collection-offloading': 'hubcollection',
    'loading-produce-dispatch': 'loading',
    'warehouse-inventory': 'warehouseinventory',
    'warehouse-maintenance': 'warehousemaintenance',
};

export const normalizeChecklistType = (checklistId) =>
    CHECKLIST_TYPE_ALIASES[checklistId] || checklistId;

// Helper function to find a department by checklist ID
export const getDepartmentForChecklist = (checklistId) => {
    const normalized = normalizeChecklistType(checklistId);
    return DEPARTMENTS_CONFIG.find((dept) => dept.checklists.includes(normalized));
};
