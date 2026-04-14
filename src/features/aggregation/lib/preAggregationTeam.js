import { doc, getDoc } from 'firebase/firestore';

/**
 * Firestore `users` docs for aggregation team picks should use:
 * - department: "aggregation"
 * - hub: same slug as checklist hub (e.g. "dwangwa-hub")
 * - status: "active"
 * - role: one of the values below (per field)
 */
export const AGGREGATION_TEAM_USER_ROLES = {
  HUB_COORDINATOR: 'hub-coordinator',
  SECURITY_LEAD: 'security-lead',
  DATA_TEAM: 'data-team',
  WAREHOUSE_SUPERVISOR: 'warehouse-supervisor',
};

/** UID form field → denormalized name field saved on submission (for review / PDFs). */
export const PRE_AGGREGATION_TEAM_UID_TO_NAME = [
  ['hub-coordinator-uid', 'hub-coordinator-name'],
  ['security-lead-uid', 'security-lead-name'],
  ['data-team-representative-uid', 'data-team-representative-name'],
  ['warehouse-supervisor-uid', 'warehouse-supervisor-name'],
];

export function collectPreAggregationTeamUids(formData) {
  const ids = PRE_AGGREGATION_TEAM_UID_TO_NAME.map(([uidKey]) => formData[uidKey]).filter(
    (v) => typeof v === 'string' && v.length > 0
  );
  return [...new Set(ids)];
}

function displayNameFromUserDoc(data) {
  if (!data) return '';
  const parts = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
  return (
    data.displayName ||
    data.name ||
    parts ||
    data.email ||
    ''
  );
}

/**
 * Adds *-name fields next to *-uid fields for manager review and legacy display keys.
 * @param {import('firebase/firestore').Firestore} db
 * @param {Record<string, unknown>} formData
 */
export async function enrichPreAggregationSubmissionWithNames(db, formData) {
  const out = { ...formData };

  for (const [uidKey, nameKey] of PRE_AGGREGATION_TEAM_UID_TO_NAME) {
    const uid = formData[uidKey];
    if (!uid || typeof uid !== 'string') continue;

    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const label = displayNameFromUserDoc(snap.data());
        out[nameKey] = label || uid;
      } else {
        out[nameKey] = uid;
      }
    } catch {
      out[nameKey] = uid;
    }
  }

  return out;
}
