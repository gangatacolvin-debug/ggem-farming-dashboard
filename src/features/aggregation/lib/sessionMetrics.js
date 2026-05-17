import { resolveChecklistField } from '@/pages/leadership/kpiService';

export const AGGREGATION_CHECKLIST_IDS = [
    'pre-aggregation-setup',
    'aggregation-quality-control',
    'aggregation-weighing-recording',
    'aggregation-warehouse-receiving',
    'aggregation-end-of-day',
];

const LOG_KEYS = ['farmer-weighing-logs', 'farmerWeighingLogs'];

export function sessionTimestampMs(session) {
    const t = session?.closedAt || session?.createdAt || session?.updatedAt;
    if (t?.toMillis) return t.toMillis();
    if (t?.toDate) return t.toDate().getTime();
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Active sessions always shown; closed default to last N days. */
export function filterSessionsForRegister(sessions, { statusFilter = 'all', days = 90 } = {}) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return (sessions || []).filter((s) => {
        if (statusFilter === 'live') return s.status === 'active';
        if (s.status === 'active') return statusFilter !== 'closed';
        if (s.status !== 'closed') return statusFilter === 'all';
        const inWindow = sessionTimestampMs(s) >= cutoff;
        if (statusFilter === 'closed') return inWindow;
        return inWindow;
    });
}

export function indexSubmissionsBySessionId(submissions) {
    const idx = {};
    for (const sub of submissions || []) {
        const sid = sub['session-id-ref'] || sub['session-id'] || sub.sessionIdRef || sub.sessionId;
        if (!sid) continue;
        if (!idx[sid]) idx[sid] = [];
        idx[sid].push(sub);
    }
    return idx;
}

export function getSubmissionByType(submissions, type) {
    return (submissions || []).find((s) => s.checklistType === type);
}

function field(sub, key) {
    return sub ? resolveChecklistField(sub, key) : undefined;
}

function normalizeWeighingLogs(weighingSub) {
    for (const k of LOG_KEYS) {
        const v = field(weighingSub, k);
        if (Array.isArray(v) && v.length) return v;
    }
    return [];
}

function addToMap(map, key, weightKg, valueMwk, count = 1) {
    const k = key || 'Unknown';
    if (!map[k]) map[k] = { key: k, weightKg: 0, valueMwk: 0, count: 0 };
    map[k].weightKg += weightKg;
    map[k].valueMwk += valueMwk;
    map[k].count += count;
}

export function buildSessionMetrics(submissions) {
    const setup = getSubmissionByType(submissions, 'pre-aggregation-setup');
    const qc = getSubmissionByType(submissions, 'aggregation-quality-control');
    const weighing = getSubmissionByType(submissions, 'aggregation-weighing-recording');
    const warehouse = getSubmissionByType(submissions, 'aggregation-warehouse-receiving');
    const eod = getSubmissionByType(submissions, 'aggregation-end-of-day');

    const logs = normalizeWeighingLogs(weighing);
    const byVariety = {};
    const byGrade = {};

    for (const log of logs) {
        const w = parseFloat(log.weightKg ?? log.weight ?? 0) || 0;
        const v = parseFloat(log.grossAmount ?? log.gross ?? 0) || 0;
        addToMap(byVariety, log.variety || 'Unknown', w, v);
        addToMap(byGrade, log.grade || 'Unknown', w, v);
    }

    const totalWeight =
        parseFloat(field(weighing, 'total-weight-kg')) ||
        logs.reduce((s, l) => s + (parseFloat(l.weightKg) || 0), 0) ||
        0;
    const totalValue =
        parseFloat(field(weighing, 'total-gross-amount')) ||
        logs.reduce((s, l) => s + (parseFloat(l.grossAmount) || 0), 0) ||
        0;
    const totalFarmers = parseFloat(field(weighing, 'total-farmers-weighed')) || logs.length || 0;
    const expectedFarmers = parseFloat(field(setup, 'expected-farmers')) || 0;
    const warehouseKg = parseFloat(field(warehouse, 'total-weight-received-kg')) || 0;
    const submittedCount = AGGREGATION_CHECKLIST_IDS.filter((id) =>
        getSubmissionByType(submissions, id)
    ).length;

    const sortRows = (map) =>
        Object.values(map).sort((a, b) => b.weightKg - a.weightKg);

    return {
        setup,
        qc,
        weighing,
        warehouse,
        eod,
        logs,
        byVariety: sortRows(byVariety),
        byGrade: sortRows(byGrade),
        totalWeight,
        totalValue,
        totalFarmers,
        expectedFarmers,
        warehouseKg,
        totalBagsWeighed: parseFloat(field(weighing, 'total-bags-weighed')) || 0,
        totalBagsReceived: parseFloat(field(warehouse, 'total-bags-received')) || 0,
        farmersReconciled: parseFloat(field(eod, 'farmers-attended-today')) || 0,
        qcRejected: parseFloat(field(qc, 'batches-rejected-count')) || 0,
        qcDowngraded: parseFloat(field(qc, 'batches-downgraded-count')) || 0,
        submittedCount,
        progressPct: (submittedCount / AGGREGATION_CHECKLIST_IDS.length) * 100,
    };
}
