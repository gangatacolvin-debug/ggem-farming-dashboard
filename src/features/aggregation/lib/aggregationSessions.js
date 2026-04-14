import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/** Canonical `aggregationSessions.status` values — enforce on write. */
export const AGGREGATION_SESSION_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
};

/** Hub slugs allowed for sessions (aligned with Pre-Aggregation Setup). */
export const AGGREGATION_VALID_HUB_SLUGS = [
  'main-site',
  'dwangwa-hub',
  'linga-hub',
  'suluwi-hub',
  'salima-hub',
];

const HUB_LABELS = {
  'main-site': 'Main Site',
  'dwangwa-hub': 'Dwangwa Hub',
  'linga-hub': 'Linga Hub',
  'suluwi-hub': 'Suluwi Hub',
  'salima-hub': 'Salima Hub',
};

/** Non-admin aggregation checklists that link via session-id-ref + hub. */
export const AGGREGATION_NON_ADMIN_CHECKLIST_IDS = new Set([
  'aggregation-quality-control',
  'aggregation-weighing-recording',
  'aggregation-warehouse-receiving',
  'aggregation-end-of-day',
]);

/**
 * Firestore document shape for `aggregationSessions/{docId}`.
 * @typedef {Object} AggregationSessionDocument
 * @property {string} sessionId Business session id (matches checklist `session-id` / `session-id-ref`).
 * @property {string} hub Hub slug (e.g. dwangwa-hub).
 * @property {string} status `active` | `closed`
 * @property {string[]} assignedTeam Firebase Auth UIDs on this session.
 * @property {string} openedByUid UID of user who opened the session (pre-aggregation submitter).
 * @property {import('firebase/firestore').FieldValue | import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').FieldValue | import('firebase/firestore').Timestamp} updatedAt
 * @property {string} [preAggregationSubmissionId]
 * @property {string} [preAggregationTaskId]
 * @property {string} [department] e.g. aggregation
 */

export function formatAggregationHubDisplay(hubSlugOrLabel) {
  if (!hubSlugOrLabel) return '';
  return HUB_LABELS[hubSlugOrLabel] || hubSlugOrLabel;
}

export function isValidAggregationHubSlug(hub) {
  return typeof hub === 'string' && AGGREGATION_VALID_HUB_SLUGS.includes(hub);
}

/** Treat only `active` as open for queries (enforced shape). */
export function isAggregationSessionActive(data) {
  return data?.status === AGGREGATION_SESSION_STATUS.ACTIVE;
}

function extractTeamIds(assignedTeam) {
  if (!assignedTeam) return [];
  if (Array.isArray(assignedTeam)) {
    return assignedTeam.flatMap((entry) => {
      if (entry == null) return [];
      if (typeof entry === 'string') return [entry];
      if (typeof entry === 'object') {
        const id = entry.uid || entry.userId || entry.userID || entry.id;
        return id ? [id] : [];
      }
      return [];
    });
  }
  if (typeof assignedTeam === 'object') {
    return Object.values(assignedTeam).filter((v) => typeof v === 'string' && v.length > 0);
  }
  return [];
}

export function isUserInAggregationAssignedTeam(assignedTeam, uid) {
  if (!uid) return false;
  return extractTeamIds(assignedTeam).includes(uid);
}

function sessionSortMillis(docSnap) {
  const d = docSnap.data();
  const u = d.updatedAt;
  const c = d.createdAt;
  if (u?.toMillis) return u.toMillis();
  if (c?.toMillis) return c.toMillis();
  return 0;
}

/**
 * @param {string} uid
 * @returns {Promise<{ firestoreDocId: string, sessionId: string, hub: string } | null>}
 */
export async function fetchActiveAggregationSessionForUser(uid) {
  if (!uid) return null;

  const q = query(
    collection(db, 'aggregationSessions'),
    where('status', '==', AGGREGATION_SESSION_STATUS.ACTIVE)
  );
  const snapshot = await getDocs(q);

  const matching = snapshot.docs.filter((docSnap) =>
    isUserInAggregationAssignedTeam(docSnap.data().assignedTeam, uid)
  );

  if (matching.length === 0) return null;

  matching.sort((a, b) => sessionSortMillis(b) - sessionSortMillis(a));
  const docSnap = matching[0];
  const data = docSnap.data();
  const sessionId = data.sessionId || data.sessionID || docSnap.id;
  const hub = data.hub || '';

  return {
    firestoreDocId: docSnap.id,
    sessionId: String(sessionId),
    hub: String(hub),
  };
}

/**
 * @param {string} hubSlug
 * @returns {Promise<{ firestoreDocId: string, sessionId: string } | null>}
 */
export async function fetchActiveAggregationSessionAtHub(hubSlug) {
  if (!hubSlug || !isValidAggregationHubSlug(hubSlug)) return null;

  const q = query(
    collection(db, 'aggregationSessions'),
    where('hub', '==', hubSlug),
    where('status', '==', AGGREGATION_SESSION_STATUS.ACTIVE)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  const sessionId = data.sessionId || data.sessionID || docSnap.id;
  return { firestoreDocId: docSnap.id, sessionId: String(sessionId) };
}

/**
 * @param {string} hubSlug
 */
export async function hasActiveAggregationSessionAtHub(hubSlug) {
  const existing = await fetchActiveAggregationSessionAtHub(hubSlug);
  return existing != null;
}

/**
 * Normalizes assignedTeam to a unique string[] of UIDs.
 * @param {string} openedByUid
 * @param {string[]|Record<string,string>} [extraTeam]
 * @returns {string[]}
 */
export function normalizeAggregationAssignedTeam(openedByUid, extraTeam) {
  const out = new Set();
  if (openedByUid) out.add(openedByUid);
  extractTeamIds(extraTeam).forEach((id) => out.add(id));
  return [...out];
}

/**
 * Builds the payload for a new `aggregationSessions` document (timestamps added at write).
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {string} params.hub
 * @param {string[]} params.assignedTeam
 * @param {string} params.openedByUid
 * @param {string} [params.preAggregationSubmissionId]
 * @param {string} [params.preAggregationTaskId]
 * @returns {Omit<AggregationSessionDocument, 'createdAt'|'updatedAt'> & { createdAt: ReturnType<typeof serverTimestamp>, updatedAt: ReturnType<typeof serverTimestamp> }}
 */
export function buildAggregationSessionCreatePayload({
  sessionId,
  hub,
  assignedTeam,
  openedByUid,
  preAggregationSubmissionId,
  preAggregationTaskId,
}) {
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new Error('aggregationSessions: sessionId is required');
  }
  if (!isValidAggregationHubSlug(hub)) {
    throw new Error(`aggregationSessions: invalid hub "${hub}"`);
  }
  if (!openedByUid) {
    throw new Error('aggregationSessions: openedByUid is required');
  }
  const team = normalizeAggregationAssignedTeam(openedByUid, assignedTeam);
  if (team.length === 0) {
    throw new Error('aggregationSessions: assignedTeam must include at least one UID');
  }

  return {
    sessionId: sessionId.trim(),
    hub,
    status: AGGREGATION_SESSION_STATUS.ACTIVE,
    assignedTeam: team,
    openedByUid,
    department: 'aggregation',
    preAggregationSubmissionId: preAggregationSubmissionId || null,
    preAggregationTaskId: preAggregationTaskId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Persists a new active session after Pre-Aggregation Setup is submitted.
 * @returns {Promise<string>} New document id
 */
export async function createAggregationSessionFromPreAggregation({
  sessionId,
  hub,
  openedByUid,
  assignedTeam,
  preAggregationSubmissionId,
  preAggregationTaskId,
}) {
  const clash = await fetchActiveAggregationSessionAtHub(hub);
  if (clash) {
    throw new Error(
      `An active aggregation session already exists at this hub (session ${clash.sessionId}).`
    );
  }

  const payload = buildAggregationSessionCreatePayload({
    sessionId,
    hub,
    assignedTeam,
    openedByUid,
    preAggregationSubmissionId,
    preAggregationTaskId,
  });

  const ref = await addDoc(collection(db, 'aggregationSessions'), payload);
  return ref.id;
}
