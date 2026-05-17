/**
 * Roles that use the field checklist UI (same routes as legacy "supervisor").
 * - `supervisor`: any department
 * - Aggregation-only operational roles: only when userDepartment === "aggregation"
 */
export const AGGREGATION_FIELD_ROLES = [
  'hub-coordinator',
  'security-lead',
  'second-security',
  'data-team',
  'warehouse-supervisor',
];

export function usesFieldWorkerDashboard(userRole, userDepartment) {
  if (!userRole) return false;
  
  const role = userRole.toLowerCase().trim();
  if (role === 'supervisor') return true;

  // Handle department as string or array
  const departments = Array.isArray(userDepartment) 
    ? userDepartment.map(d => String(d || '').toLowerCase().trim()) 
    : [String(userDepartment || '').toLowerCase().trim()];

  const isAggregation = departments.includes('aggregation');
  const isFieldRole = AGGREGATION_FIELD_ROLES.includes(role);

  console.log('Access Check:', { role, departments, isAggregation, isFieldRole });

  if (isAggregation && isFieldRole) {
    return true;
  }
  
  return false;
}

/** For Task Management assignee picker (aggregation): supervisors + aggregation field roles */
export const AGGREGATION_TASK_ASSIGNEE_ROLES = ['supervisor', ...AGGREGATION_FIELD_ROLES];
