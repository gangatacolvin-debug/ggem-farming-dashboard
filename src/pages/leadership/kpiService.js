import { format } from 'date-fns';

export const getValue = (doc, fieldName) => {
    if (!doc) return undefined;
    if (doc[fieldName] !== undefined && doc[fieldName] !== null) return doc[fieldName];
    if (doc.data && typeof doc.data === 'object' && !Array.isArray(doc.data)) {
        const fromData = doc.data[fieldName];
        if (fromData !== undefined && fromData !== null) return fromData;
    }
    if (doc.summary && doc.summary[fieldName] !== undefined && doc.summary[fieldName] !== null) return doc.summary[fieldName];
    if (doc.formData && doc.formData[fieldName] !== undefined && doc.formData[fieldName] !== null) return doc.formData[fieldName];

    // Search within section objects (top-level and nested `data`)
    const scan = (obj) => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date) && !val?.toDate) {
                if (val[fieldName] !== undefined && val[fieldName] !== null) return val[fieldName];
            }
        }
        return undefined;
    };
    const nested = scan(doc);
    if (nested !== undefined) return nested;
    if (doc.data && typeof doc.data === 'object') {
        const inData = scan(doc.data);
        if (inData !== undefined) return inData;
    }
    return undefined;
};

/** Prefer operational / business date for charts (matches Firestore usage). */
export const getSubmissionDateForTrend = (doc) => {
    if (!doc) return null;
    const order = [doc.sessionDate, doc.submittedAt, doc.updatedAt, doc.createdAt, doc.timestamp, doc.completedAt, doc.approvedAt];
    for (const ts of order) {
        if (ts?.toDate) return ts.toDate();
    }
    return null;
};

const kebabToCamel = (key) => key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/**
 * Read a checklist field from submissions (flat) or tasks (checklistProgress) without migrating Firestore.
 * Tries kebab-case (form config), camelCase (legacy), then getValue() nested scan.
 */
export const resolveChecklistField = (doc, fieldKey) => {
    if (!doc) return undefined;
    const keys = fieldKey.includes('-') ? [fieldKey, kebabToCamel(fieldKey)] : [fieldKey];
    const sources = [doc, doc.checklistProgress, doc.formData].filter(Boolean);

    for (const source of sources) {
        for (const k of keys) {
            const v = source[k];
            if (v !== undefined && v !== null && v !== '') return v;
        }
    }
    for (const k of keys) {
        const v = getValue(doc, k);
        if (v !== undefined && v !== null && v !== '') return v;
    }
    return undefined;
};

const MILLING_CHECKLIST_TYPES = new Set(['milling', 'milling-process']);

/** Same formula as LogTableField deriveMilling — used when huskBran was not persisted on the row */
const deriveRowHuskBran = (row) => {
    const stored = parseFloat(row.huskBran);
    if (!Number.isNaN(stored) && stored > 0) return stored;
    const paddy = parseFloat(row.paddyFed) || 0;
    if (paddy <= 0) return 0;
    return (
        paddy -
        (parseFloat(row.milledRice) || 0) -
        (parseFloat(row.brokenRice) || 0) -
        (parseFloat(row.colorsorter) || 0) -
        (parseFloat(row.dustLiters) || 0) -
        (parseFloat(row.stonesRice) || 0)
    );
};

export const aggregateMillingData = (tasks = []) => {
    const r2 = (val) => Math.round(val * 100) / 100;
    const num = (val) => parseFloat(val) || 0;
    const sumFromLogs = (logs, key) => (logs || []).reduce((acc, row) => acc + num(row[key]), 0);
    const sumHuskFromLogs = (logs) =>
        (logs || []).reduce((acc, row) => acc + deriveRowHuskBran(row), 0);

    const millingTasks = tasks.filter((t) => MILLING_CHECKLIST_TYPES.has(t.checklistType));

    let totalPaddy = 0;
    let totalMilled = 0;
    let totalBroken = 0;
    let totalColor = 0;
    let totalDust = 0;
    let totalStones = 0;
    let totalHuskBran = 0;
    let totalDowntime = 0;

    const varietyTotals = {};
    const yieldTrendData = [];
    const shiftRows = [];
    const outputBreakdown = [];

    millingTasks.forEach((task) => {
        const progress = task.checklistProgress || task.formData || task;
        const logs = progress.hourlyLogs || task.hourlyLogs || [];

        const taskDefaultVariety =
            resolveChecklistField(task, 'default-variety') ||
            resolveChecklistField(task, 'variety') ||
            resolveChecklistField(task, 'rice-type') ||
            null;

        const taskPaddy = sumFromLogs(logs, 'paddyFed');
        const taskMilled = sumFromLogs(logs, 'milledRice');
        const taskBroken = sumFromLogs(logs, 'brokenRice');
        const taskColor = sumFromLogs(logs, 'colorsorter');
        const taskDust = sumFromLogs(logs, 'dustLiters');
        const taskStones = sumFromLogs(logs, 'stonesRice');
        const taskHuskBran = sumHuskFromLogs(logs);
        const taskDowntime = sumFromLogs(logs, 'downtime');

        totalPaddy += taskPaddy;
        totalMilled += taskMilled;
        totalBroken += taskBroken;
        totalColor += taskColor;
        totalDust += taskDust;
        totalStones += taskStones;
        totalHuskBran += taskHuskBran;
        totalDowntime += taskDowntime;

        // ── FIX 2: per-row variety falls back to task default ────────────────
        logs.forEach((row) => {
            const variety = row.variety || taskDefaultVariety || 'unknown';
            if (!varietyTotals[variety]) {
                varietyTotals[variety] = { paddy: 0, milled: 0, broken: 0 };
            }
            varietyTotals[variety].paddy += num(row.paddyFed);
            varietyTotals[variety].milled += num(row.milledRice);
            varietyTotals[variety].broken += num(row.brokenRice);
        });

        const submittedAt =
            getSubmissionDateForTrend(task) ||
            task.endTime?.toDate?.() ||
            task.completedAt?.toDate?.() ||
            (progress.completedAt ? new Date(progress.completedAt) : null);

        const shiftTypeRaw = resolveChecklistField(task, 'shift-type');
        const shiftType =
            shiftTypeRaw ||
            (['morning', 'afternoon', 'night'].includes(String(task.shift || '').toLowerCase())
                ? task.shift
                : null) ||
            'Unknown';

        const dateLabel = submittedAt
            ? submittedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
            : 'Unknown';
        const chartLabel = `${dateLabel} · ${String(shiftType).charAt(0).toUpperCase()}${String(shiftType).slice(1)}`;

        const yieldPct = taskPaddy > 0 ? r2((taskMilled / taskPaddy) * 100) : 0;
        const breakagePct = taskPaddy > 0 ? r2((taskBroken / taskPaddy) * 100) : 0;

        yieldTrendData.push({ time: chartLabel, yield: yieldPct, target: 65 });

        const supervisorName =
            resolveChecklistField(task, 'supervisor-signoff') ||
            resolveChecklistField(task, 'supervisor-name') ||
            task.submittedByName ||
            task.supervisorName ||
            'Unassigned';

        const status = String(task.status || 'pending').toLowerCase();

        shiftRows.push({
            submissionId: task.id,
            taskId: task.taskId || null,
            date: dateLabel,
            submittedAtMs: submittedAt ? submittedAt.getTime() : 0,
            shift: shiftType,
            variety: taskDefaultVariety || '—',
            supervisorName,
            status,
            paddy: r2(taskPaddy),
            milled: r2(taskMilled),
            broken: r2(taskBroken),
            color: r2(taskColor),
            huskBran: r2(taskHuskBran),
            yield: yieldPct,
            breakage: breakagePct,
            downtime: r2(taskDowntime),
        });

        outputBreakdown.push({
            name: chartLabel,
            milled: r2(taskMilled),
            broken: r2(taskBroken),
            colorsorter: r2(taskColor),
            huskBran: r2(taskHuskBran),
        });
    });

    const overallYield = totalPaddy > 0 ? r2((totalMilled / totalPaddy) * 100) : 0;
    const overallBreakage = totalPaddy > 0 ? r2((totalBroken / totalPaddy) * 100) : 0;

    shiftRows.sort((a, b) => b.submittedAtMs - a.submittedAtMs);

    const varietySummary = Object.entries(varietyTotals).map(([variety, v]) => ({
        variety,
        label: variety === 'kayanjamalo' ? 'Kayanjamalo'
            : variety === 'kilombero' ? 'Kilombero'
                : variety,
        paddy: r2(v.paddy),
        milled: r2(v.milled),
        broken: r2(v.broken),
        yield: v.paddy > 0 ? r2((v.milled / v.paddy) * 100) : 0,
        breakage: v.paddy > 0 ? r2((v.broken / v.paddy) * 100) : 0,
    }));

    return {
        totalPaddy,
        totalMilled,
        totalBroken,
        totalColor,
        totalDust,
        totalStones,
        totalHuskBran,
        totalDowntime,
        overallYield,
        overallBreakage,
        yieldTrendData,
        outputBreakdown,
        shiftRows,
        varietySummary,
        submissionCount: millingTasks.length,
        totalUnmilled: totalPaddy,
    };
};

export const aggregateBriquetteData = (tasks) => {
    let totalBriquettesProduced = 0;
    let totalHuskUsed = 0;
    let totalAshContent = 0;
    let totalFuelUsed = 0;
    let downtimeLog = [];
    let ashContentCount = 0;
    const efficiencyTrend = [];

    const briquetteTasks = tasks.filter(t => t.checklistType === 'briquette-production' || t.checklistType === 'briquette');

    briquetteTasks.forEach(task => {
        totalBriquettesProduced += Number(getValue(task, 'totalOutput')) || Number(getValue(task, 'actual-output')) || 0;
        totalHuskUsed += Number(getValue(task, 'totalHuskUsed')) || Number(getValue(task, 'total-husk-used')) || 0;
        totalFuelUsed += Number(getValue(task, 'totalFuelUsed')) || Number(getValue(task, 'fuel-consumed')) || 0;

        const ash = Number(getValue(task, 'avgAshContent')) || Number(getValue(task, 'ash-content'));
        if (!isNaN(ash) && ash > 0) {
            totalAshContent += ash;
            ashContentCount++;
        }

        const hrLogs = task.hourlyLogs || getValue(task, 'hourlyLogs') || [];
        hrLogs.forEach((log, index) => {
            const out = Number(log.actualOutput) || Number(log.briquettesProduced) || 0;
            const husk = Number(log.rawHuskUsed) || 0;

            if (log.downtime || log.notes) {
                if (log.notes) {
                    downtimeLog.push({ reason: log.notes, hours: (Number(log.downtime) || Number(log.downtimeMinutes) || 30) / 60 });
                }
            }

            efficiencyTrend.push({
                hour: log.hour || log.time || `Hour ${index + 1}`,
                output: out,
                target: Number(log.expectedOutput) || 500,
                efficiency: husk > 0 ? (out / husk * 100).toFixed(1) : 0
            });
        });
    });

    // Consolidate downtimeLog
    const combinedDowntime = {};
    downtimeLog.forEach(d => {
        combinedDowntime[d.reason] = (combinedDowntime[d.reason] || 0) + d.hours;
    });
    const finalDowntimeLog = Object.keys(combinedDowntime).map(k => ({ reason: k, hours: Number(combinedDowntime[k].toFixed(1)) }));

    const avgAshContent = ashContentCount > 0 ? (totalAshContent / ashContentCount).toFixed(1) : 0;

    return { totalBriquettesProduced, totalHuskUsed, avgAshContent, efficiencyTrend, downtimeData: finalDowntimeLog, totalFuelUsed };
};

export const aggregateHubTransfersData = (tasks) => {
    let onTimeCount = 0;
    let totalTrips = 0;
    const hubTableData = [];
    const incidentLog = [];

    const transferTasks = tasks.filter((t) => {
        const ct = String(t.checklistType || '').toLowerCase();
        return (
            ct === 'hub-transfer-inspection' ||
            ct === 'hubtransfer' ||
            ct === 'hub-transfer' ||
            ct === 'hubcollection' ||
            ct === 'hub-collection-offloading' ||
            ct === 'loading' ||
            ct.includes('hub-collection') ||
            ct.includes('hub-transfer')
        );
    });
    totalTrips = transferTasks.length;

    transferTasks.forEach(task => {
        const depTime = getValue(task, 'departure-time-hq') || getValue(task, 'departure-time');
        if (depTime && String(depTime).trim() && String(depTime) <= '08:30') {
            onTimeCount++;
        }

        const anomalies = getValue(task, 'anomalies-details') || getValue(task, 'discrepancy-details') || (getValue(task, 'anomalies-found') && 'Anomaly found at hub');
        if (anomalies) {
            incidentLog.push({
                id: task.id,
                date: task.submittedAt?.toDate
                    ? format(task.submittedAt.toDate(), 'MMM dd, yyyy')
                    : (task.sessionDate?.toDate
                        ? format(task.sessionDate.toDate(), 'MMM dd, yyyy')
                        : (task.updatedAt?.toDate
                            ? format(task.updatedAt.toDate(), 'MMM dd, yyyy')
                            : 'Recent')),
                hub: getValue(task, 'destination-hub') || 'Unknown Hub',
                issue: anomalies,
                status: 'Closed' // these are submitted / past tasks
            });
        }

        // Aggregate per hub
        const hub = getValue(task, 'destination-hub');
        if (hub) {
            let existingHub = hubTableData.find(h => h.hub.toLowerCase() === hub.toLowerCase());
            if (!existingHub) {
                existingHub = {
                    hub: hub,
                    bagsTransferred: 0,
                    avgMoisture: 0,
                    moistureCount: 0,
                    incidents: 0,
                    status: 'Active'
                };
                hubTableData.push(existingHub);
            }
            existingHub.bagsTransferred +=
                Number(getValue(task, 'bags-loaded')) ||
                Number(getValue(task, 'bags-counted')) ||
                Number(getValue(task, 'final-bag-count')) ||
                0;
            if (anomalies) existingHub.incidents++;

            const moistLogs = task.moistureLogs || getValue(task, 'moistureLogs') || [];
            moistLogs.forEach(log => {
                existingHub.avgMoisture += Number(log.moistureLevel) || 0;
                existingHub.moistureCount++;
            });
        }
    });

    hubTableData.forEach(h => {
        if (h.moistureCount > 0) {
            h.avgMoisture = (h.avgMoisture / h.moistureCount).toFixed(1);
        }
    });

    const onTimePercentage = totalTrips > 0 ? ((onTimeCount / totalTrips) * 100).toFixed(0) : 0;

    return { totalTrips, onTimePercentage, hubTableData, incidentLog };
};

export const aggregateInventoryData = (tasks) => {
    let totalStock = 0;
    let damagedBags = 0;
    let fullAudits = 0;
    let matchedAudits = 0;
    let cleanlinessTotal = 0;
    let cleanlinessCount = 0;
    const stockByWarehouse = [];

    const inventoryTasks = tasks.filter(t => t.checklistType === 'warehouse-inventory' || t.checklistType === 'inventory-audit' || t.checklistType === 'warehouseinventory');

    inventoryTasks.forEach(task => {
        damagedBags += Number(getValue(task, 'damaged-expired-count')) || Number(getValue(task, 'damaged-bags-received')) || Number(getValue(task, 'damaged-bags-count')) || 0;

        if (getValue(task, 'audit-type') === 'full-audit' || getValue(task, 'auditType') === 'full-audit') {
            fullAudits++;
            if (getValue(task, 'cross-check-balance') === true) matchedAudits++;
        }

        const cleanRating = getValue(task, 'cleanliness-rating');
        if (cleanRating) {
            cleanlinessTotal += Number(cleanRating);
            cleanlinessCount++;
        }

        const warehouseId = getValue(task, 'warehouse-id') || 'main-warehouse';
        if (warehouseId) {
            let existing = stockByWarehouse.find(w => w.name.toLowerCase() === warehouseId.toLowerCase());
            if (!existing) {
                existing = { name: warehouseId, value: 0 };
                stockByWarehouse.push(existing);
            }
            existing.value += Number(getValue(task, 'system-balance-weight')) || Number(getValue(task, 'tonnes-received')) || 0;
        }
    });

    stockByWarehouse.forEach(w => {
        totalStock += w.value;
    });

    const auditAccuracy = fullAudits > 0 ? ((matchedAudits / fullAudits) * 100).toFixed(1) : 100;
    const maintenanceScore = cleanlinessCount > 0 ? ((cleanlinessTotal / cleanlinessCount) * 10).toFixed(0) : 100;

    return { totalStock, damagedBags, auditAccuracy, maintenanceScore, stockByWarehouse };
};

export const calculateProcessingKPIs = (tasks) => {
    const millingData = aggregateMillingData(tasks);
    const briquetteData = aggregateBriquetteData(tasks);

    return {
        totalMilledRiced: millingData.totalMilled,
        totalBriquettesProduced: briquetteData.totalBriquettesProduced
    };
};

export const calculateWarehousingKPIs = (tasks) => {
    const invData = aggregateInventoryData(tasks);
    const hubData = aggregateHubTransfersData(tasks);

    return {
        tasksWithIncident: hubData.incidentLog.length,
        totalDamagedBags: invData.damagedBags
    };
};

export const getDepartmentAlerts = (tasks) => {
    return tasks.filter(t => t.locationCompliant === false || (t.formData && t.formData['machinery-inspected'] === false));
};
