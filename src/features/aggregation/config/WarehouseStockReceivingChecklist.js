/**
 * Warehouse & Stock Receiving Checklist
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const warehouseStockReceivingConfig = {
    id: 'aggregation-warehouse-receiving',
    title: 'Warehouse & Stock Receiving Checklist',
    description: 'Filled by Warehouse Supervisor at end of day — confirms stock received and stored correctly',

    sections: [
        {
            id: 'session-link',
            title: 'Session Information',
            icon: '📋',
            description: 'Link this checklist to the active aggregation session',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                { id: 'session-id-ref', type: 'text', label: 'Session ID', placeholder: 'Enter active session ID', required: true },
                { id: 'hub', type: 'text', label: 'Hub', placeholder: 'Enter hub name', required: true },
                { id: 'date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'warehouse-supervisor-name', type: 'text', label: 'Warehouse Supervisor Name', autoPopulate: 'supervisorName', required: true }
            ]
        },

        {
            id: 'stock-receiving',
            title: 'Section 1 — Stock Receiving',
            icon: '📦',
            description: 'Confirm all incoming stock was received and verified',
            estimatedDuration: 15,
            requiresLocation: false,
            fields: [
                { id: 'stock-verified-against-records', type: 'checkbox', label: 'Incoming stock verified against weighing records', required: true },
                { id: 'bags-stacked-by-variety', type: 'checkbox', label: 'Bags stacked by variety and grade', required: true },
                { id: 'bags-stacked-by-batch', type: 'checkbox', label: 'Bags stacked by batch' },
                { id: 'color-coding-maintained', type: 'checkbox', label: 'Color coding maintained per variety' },
                { id: 'total-bags-received', type: 'number', label: 'Total Bags Received Today', placeholder: '0', required: true },
                { id: 'total-weight-received-kg', type: 'number', label: 'Total Weight Received (kg)', placeholder: '0', required: true },
                { id: 'total-bags-rejected', type: 'number', label: 'Total Bags Rejected / Returned', placeholder: '0' }
            ]
        },

        {
            id: 'decanting-physical-checks',
            title: 'Section 2 — Decanting & Physical Checks',
            icon: '🔄',
            description: 'Confirm decanting was done correctly and secondary quality check completed',
            estimatedDuration: 15,
            requiresLocation: false,
            fields: [
                { id: 'decanting-conducted-properly', type: 'checkbox', label: 'Decanting conducted properly with no spillage', required: true },
                { id: 'secondary-quality-check-done', type: 'checkbox', label: 'Secondary quality check done during decanting', required: true },
                { id: 'secondary-issues-found', type: 'checkbox', label: 'Issues found during secondary quality check' },
                { id: 'secondary-issues-details', type: 'textarea', label: 'Secondary Quality Issues (if any)', placeholder: 'Describe any issues found during decanting...' },
                { id: 'bags-sewn-securely', type: 'checkbox', label: 'Bags sewn securely' },
                { id: 'labels-applied', type: 'checkbox', label: 'Labels and stickers applied correctly' },
                { id: 'casuals-supervised', type: 'checkbox', label: 'Casual labourers supervised throughout decanting' },
                { id: 'work-area-clean', type: 'checkbox', label: 'Work area kept clean during operations' }
            ]
        },

        {
            id: 'storage-condition',
            title: 'Section 3 — Storage Condition',
            icon: '🏪',
            description: 'Confirm storage area is suitable and stock is properly stored',
            estimatedDuration: 10,
            requiresLocation: false,
            fields: [
                { id: 'storage-dry', type: 'checkbox', label: 'Storage area confirmed dry', required: true },
                { id: 'storage-pest-free', type: 'checkbox', label: 'No pests or infestation signs found', required: true },
                { id: 'damaged-bags-found', type: 'checkbox', label: 'Damaged bags found during storage' },
                { id: 'damaged-bags-count', type: 'number', label: 'Number of Damaged Bags', placeholder: '0' },
                { id: 'storage-issues-notes', type: 'textarea', label: 'Storage Issues / Notes', placeholder: 'Describe any storage issues...' },
                { id: 'stock-records-updated', type: 'checkbox', label: 'Stock records updated in system', required: true }
            ]
        },

        {
            id: 'sign-off',
            title: 'Warehouse Supervisor Sign-off',
            icon: '🖊️',
            description: 'Warehouse Supervisor confirms stock received and stored correctly',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                { id: 'signoff-warehouse-name', type: 'text', label: 'Warehouse Supervisor Name', autoPopulate: 'supervisorName', required: true },
                { id: 'signoff-date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'signoff-signature', type: 'text', label: 'Signature', placeholder: 'Type full name as signature', required: true }
            ]
        },

        {
            id: 'summary',
            title: 'Warehouse Receiving Summary',
            icon: '📊',
            description: 'Auto-generated warehouse receiving summary',
            estimatedDuration: 2,
            requiresLocation: false,
            fields: [
                {
                    id: 'warehouse-receiving-summary',
                    type: 'summary',
                    label: 'Warehouse & Stock Receiving Summary'
                }
            ]
        }
    ]
};