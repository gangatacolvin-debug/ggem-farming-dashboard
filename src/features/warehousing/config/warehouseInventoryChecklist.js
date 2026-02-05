/**
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const warehouseInventoryChecklistConfig = {
    id: 'warehouse-inventory',
    title: 'Warehouse Inventory Additions & Audit Checklist',
    description: 'Protocol for adding stock and auditing warehouse inventory',

    locationCheckpoints: {},

    sections: [
        {
            id: 'details',
            title: 'Audit Details',
            icon: '📋',
            description: 'Audit scope and team identification',
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
                {
                    id: 'audit-type',
                    type: 'select',
                    label: 'Audit Type',
                    options: [
                        { value: 'addition', label: 'Inventory Addition' },
                        { value: 'full-audit', label: 'Full Audit' },
                        { value: 'spot-check', label: 'Spot Check' }
                    ],
                    required: true
                },
                { id: 'warehouse-lead', type: 'text', label: 'Warehouse Lead', required: true },
                { id: 'security-on-duty', type: 'text', label: 'Security On Duty', required: true },
                { id: 'auditor-name', type: 'text', label: 'Auditor (if external)' }
            ]
        },
        {
            id: 'pre-check',
            title: 'Stage 1: Pre-Check',
            icon: '🔍',
            description: 'Document verification and initial counts',
            fields: [
                { id: 'audit-scope-confirmed', type: 'checkbox', label: 'Confirm audit type and scope' },
                { id: 'documents-verified', type: 'checkbox', label: 'Verify documents: delivery notes, dispatch forms, GRNs' },
                { id: 'system-balance-count', type: 'number', label: 'Starting inventory count (System Bags)', placeholder: '0' },
                { id: 'system-balance-weight', type: 'number', label: 'Starting inventory weight (System Tonnes)', placeholder: '0' },
                { id: 'security-entry-confirmed', type: 'checkbox', label: 'Security confirms entry logs and checks truck/driver IDs' },
                { id: 'start-time', type: 'time', label: 'Timestamp start', required: true }
            ]
        },
        {
            id: 'inventory-additions',
            title: 'Stage 2: Inventory Additions (Incoming Stock)',
            icon: '📥',
            description: 'Process for receiving new stock',
            fields: [
                { id: 'truck-arrival-time', type: 'time', label: 'Record truck arrival time' },
                { id: 'load-docs-verified', type: 'checkbox', label: 'Verify documents against load: origin, variety, weight' },
                { id: 'vehicle-condition', type: 'checkbox', label: 'Inspect vehicle & load condition (tarpaulin, damage)' },
                { id: 'bags-received', type: 'number', label: 'Bags Received', placeholder: '0' },
                { id: 'tonnes-received', type: 'number', label: 'Tonnes received (Auto-calc)', readOnly: true, placeholder: '(Bags * 50kg) / 1000' },
                { id: 'moisture-tests', type: 'checkbox', label: 'Conduct moisture tests on random samples (min 10 bags)' },
                { id: 'damaged-bags-received', type: 'number', label: 'Damaged/rejected bags count', placeholder: '0' },
                { id: 'security-verified-additions', type: 'checkbox', label: 'Security verifies all counts independently' },
                { id: 'staff-present', type: 'text', label: 'Staff present for unloading (Names/IDs)' },
                { id: 'stacking-location', type: 'text', label: 'Storage location (Aisle, Row, Stack ID)', placeholder: 'e.g. Row 3, Stack B' }
            ]
        },
        {
            id: 'inventory-audit',
            title: 'Stage 3: Inventory Audit (Verification)',
            icon: '📝',
            description: 'Physical counting and condition checks',
            fields: [
                {
                    id: 'stack-counts',
                    type: 'log-table',
                    label: 'Stack Counts',
                    columns: [
                        { key: 'stackId', label: 'Stack ID', type: 'text' },
                        { key: 'bagCount', label: 'Physical Count', type: 'number' },
                        { key: 'condition', label: 'Condition (1-10)', type: 'number' },
                        { key: 'notes', label: 'Notes', type: 'text' }
                    ]
                },
                { id: 'cross-check-balance', type: 'checkbox', label: 'Cross-check against system balance' },
                { id: 'security-parallel-count', type: 'checkbox', label: 'Security conducts a parallel count & submits verification' },
                { id: 'discrepancies-investigated', type: 'checkbox', label: 'Investigate discrepancies immediately' },
                { id: 'tampering-check', type: 'checkbox', label: 'Inspect stacks for tampering, pests, or spillage' },
                { id: 'cleanliness-rating', type: 'number', label: 'Rate cleanliness of storage area (1-10)', placeholder: '10', min: 1, max: 10 },
                { id: 'damaged-expired-count', type: 'number', label: 'Record damaged/expired bags identified', placeholder: '0' }
            ]
        },
        {
            id: 'reconciliation',
            title: 'Stage 4: Reconciliation & Reporting',
            icon: '📊',
            description: 'Updating systems and logging discrepancies',
            fields: [
                { id: 'odoo-updated', type: 'checkbox', label: 'Update Odoo/CRM with new counts' },
                { id: 'docs-attached', type: 'checkbox', label: 'Attach scanned documents (delivery notes, GRN)' },
                { id: 'security-upload', type: 'checkbox', label: 'Security uploads their own completed form' },
                { id: 'anomalies-reported', type: 'checkbox', label: 'Report anomalies to Warehouse Lead + Security Lead' },
                { id: 'corrective-actions', type: 'text', label: 'Record corrective actions', placeholder: 'e.g., re-weighing, pest control' }
            ]
        },
        {
            id: 'closure',
            title: 'Stage 5: Closure',
            icon: '🔒',
            description: 'Securing the premise and final sign-off',
            fields: [
                { id: 'warehouse-secured', type: 'checkbox', label: 'Warehouse secured post-audit (doors locked, cameras checked)' },
                { id: 'perimeter-confirmed', type: 'checkbox', label: 'Security confirms perimeter inspection complete' },
                { id: 'leads-signoff', type: 'checkbox', label: 'Supervisor + Security Lead both review and sign off', required: true },
                { id: 'closure-time', type: 'time', label: 'Timestamp closure', required: true }
            ]
        }
    ]
};
