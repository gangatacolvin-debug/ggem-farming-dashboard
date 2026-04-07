/**
 * Sales & Marketing - Weekly Checklist
 * @type {import('../../checklists/components/ChecklistEngine').ChecklistConfig}
 */
export const salesMarketingChecklistConfig = {
    id: 'sales-marketing',
    title: 'Sales & Marketing Checklist',
    description: 'Weekly sales activation and market engagement workflow',

    sections: [
        {
            id: 'header',
            title: 'Header Information',
            description: 'Record basic information before starting',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                { id: 'checklist-id', type: 'text', label: 'Checklist ID', placeholder: 'Auto-generated', readOnly: true },
                { id: 'week-of', type: 'date', label: 'Week of', required: true },
                { id: 'zone-district', type: 'text', label: 'Zone / District', placeholder: 'Enter zone or district', required: true },
                { id: 'team-responsible', type: 'text', label: 'Team Responsible', placeholder: 'Enter team name', required: true },
                { id: 'supervisor-name', type: 'text', label: 'Supervisor Name', autoPopulate: 'supervisorName', required: true },
                { id: 'line-manager', type: 'text', label: 'Line Manager', placeholder: 'Enter line manager name', required: true },
                { id: 'date-of-evaluation', type: 'date', label: 'Date of Evaluation', autoPopulate: 'date', required: true }
            ]
        },

        {
            id: 'pre-sales-preparation',
            title: 'Section 1 — Pre-Sales Preparation',
            description: 'Confirm targets, materials, and logistics before heading to the field',
            estimatedDuration: 15,
            requiresLocation: false,
            fields: [
                { id: 'sales-targets-reviewed', type: 'checkbox', label: 'Weekly sales targets reviewed by product and zone' },
                { id: 'stock-availability-confirmed', type: 'checkbox', label: 'Stock availability and product prices confirmed' },
                { id: 'marketing-materials-prepared', type: 'checkbox', label: 'Marketing collateral and promotional materials prepared' },
                { id: 'transport-fuel-confirmed', type: 'checkbox', label: 'Transport and fuel confirmed for product deliveries' },
                { id: 'callcentre-coordinated', type: 'checkbox', label: 'Call-centre coordinated for customer lead updates' },
                { id: 'team-briefed', type: 'checkbox', label: 'FMT / sales team briefed on daily and weekly targets', required: true },
                { id: 'prep-notes', type: 'textarea', label: 'Preparation Notes', placeholder: 'Enter any notes...' },
                { id: 'prep-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'field-sales-execution',
            title: 'Section 2 — Field Sales Execution',
            description: 'Record daily field sales activities and customer interactions',
            estimatedDuration: 60,
            requiresLocation: false,
            fields: [
                { id: 'demos-conducted', type: 'checkbox', label: 'Product demonstrations or kiosk visits conducted' },
                { id: 'customer-visits-count', type: 'number', label: 'Number of customer visits made', placeholder: '0', required: true },
                { id: 'sales-registered', type: 'checkbox', label: 'All sales and payments registered in CRM or receipt book', required: true },
                { id: 'feedback-collected', type: 'checkbox', label: 'Customer feedback and satisfaction notes collected' },
                { id: 'leads-followed-up', type: 'checkbox', label: 'Pending leads from previous weeks followed up' },
                { id: 'photos-captured', type: 'checkbox', label: 'Photos captured for verification and reporting' },
                { id: 'cash-reconciliation-done', type: 'checkbox', label: 'Cash handling and reconciliation completed at end of day', required: true },
                { id: 'sales-volume-units', type: 'number', label: 'Sales Volume (kg or units)', placeholder: '0', required: true },
                { id: 'sales-value-mwk', type: 'number', label: 'Sales Value (MWK)', placeholder: '0', required: true },
                { id: 'new-customers-reached', type: 'number', label: 'New Customers Reached', placeholder: '0' },
                { id: 'leads-converted-count', type: 'number', label: 'Leads Converted (count)', placeholder: '0' },
                { id: 'kiosk-visits-count', type: 'number', label: 'Kiosk Visits Conducted', placeholder: '0' },
                { id: 'complaints-resolved-count', type: 'number', label: 'Customer Complaints Resolved', placeholder: '0' },
                { id: 'execution-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'market-development',
            title: 'Section 3 — Market Development',
            description: 'Identify new opportunities and gather market intelligence',
            estimatedDuration: 20,
            requiresLocation: false,
            fields: [
                { id: 'new-outlets-identified', type: 'checkbox', label: 'New market outlets or retailers identified' },
                { id: 'partners-engaged', type: 'checkbox', label: 'Local partners or CBOs engaged to expand distribution' },
                { id: 'competitor-data-gathered', type: 'checkbox', label: 'Competitor pricing or product data gathered' },
                { id: 'improvements-recommended', type: 'checkbox', label: 'Marketing improvements recommended based on observations' },
                { id: 'market-notes', type: 'textarea', label: 'Market Development Notes', placeholder: 'Enter observations...' },
                { id: 'market-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'reporting-review',
            title: 'Section 4 — Reporting & Review',
            description: 'Submit daily and weekly reports and attend review meetings',
            estimatedDuration: 20,
            requiresLocation: false,
            fields: [
                { id: 'daily-sales-submitted', type: 'checkbox', label: 'Daily sales data submitted by 6pm each day', required: true },
                { id: 'totals-verified', type: 'checkbox', label: 'Daily totals verified against receipts and CRM logs', required: true },
                { id: 'weekly-summary-submitted', type: 'checkbox', label: 'Weekly summary submitted (total sales, leads, conversions, key insights)', required: true },
                { id: 'review-meeting-attended', type: 'checkbox', label: 'Sales performance review meeting attended' },
                { id: 'tracker-updated', type: 'checkbox', label: 'Sales tracker updated with weekly achievements' },
                { id: 'reporting-notes', type: 'textarea', label: 'Reporting Notes', placeholder: 'Enter any notes...' },
                { id: 'reporting-timestamp', type: 'time', label: 'Timestamp', placeholder: 'HH:MM', autoPopulate: 'timestamp' }
            ]
        },

        {
            id: 'sign-off',
            title: 'Supervisor Sign-off',
            description: 'Supervisor confirms all sections are complete and accurate',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                { id: 'signoff-supervisor-name', type: 'text', label: 'Supervisor Name', autoPopulate: 'supervisorName', required: true },
                { id: 'signoff-date', type: 'date', label: 'Date', autoPopulate: 'date', required: true },
                { id: 'signoff-signature', type: 'text', label: 'Signature', placeholder: 'Type full name as signature', required: true }
            ]
        },

        {
            id: 'summary',
            title: 'Summary & KPIs',
            description: 'Auto-generated summary of the weekly sales performance',
            estimatedDuration: 5,
            requiresLocation: false,
            fields: [
                {
                    id: 'sales-marketing-summary',
                    type: 'summary',
                    label: 'Weekly Sales & Marketing Performance Summary'
                }
            ]
        }
    ]
};