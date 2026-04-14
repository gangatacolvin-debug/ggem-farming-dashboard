/**
 * Roles that use the field checklist UI (same routes as legacy "supervisor").
 * - `supervisor`: any department
 * - Aggregation-only operational roles: only when userDepartment === "aggregation"
 */
export const AGGREGATION_FIELD_ROLES = [
  'hub-coordinator',
  'security-lead',
  'data-team',
  'warehouse-supervisor',
];

export function usesFieldWorkerDashboard(userRole, userDepartment) {
  if (!userRole) return false;
  if (userRole === 'supervisor') return true;
  if (userDepartment === 'aggregation' && AGGREGATION_FIELD_ROLES.includes(userRole)) {
    return true;
  }
  return false;
}

/** For Task Management assignee picker (aggregation): supervisors + aggregation field roles */
export const AGGREGATION_TASK_ASSIGNEE_ROLES = ['supervisor', ...AGGREGATION_FIELD_ROLES];
