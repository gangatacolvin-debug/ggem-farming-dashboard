import { format } from 'date-fns';

export const getValue = (doc, fieldName) => {
    if (!doc) return undefined;
    if (doc[fieldName] !== undefined && doc[fieldName] !== null) return doc[fieldName];
    if (doc.summary && doc.summary[fieldName] !== undefined && doc.summary[fieldName] !== null) return doc.summary[fieldName];
    if (doc.formData && doc.formData[fieldName] !== undefined && doc.formData[fieldName] !== null) return doc.formData[fieldName];

    // Search within section objects
    for (const key of Object.keys(doc)) {
        const val = doc[key];
        if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date) && !val.toDate) {
            if (val[fieldName] !== undefined && val[fieldName] !== null) return val[fieldName];
        }
    }
    return undefined;
};

export const aggregateMillingData = (tasks) => {
    let totalMilled = 0;
    let totalUnmilled = 0;
    let totalBroken = 0;
    let totalDowntime = 0;
    const yieldTrendData = [];

    const millingTasks = tasks.filter(t => t.checklistType === 'milling-process' || t.checklistType === 'milling');

    millingTasks.forEach(task => {
        totalMilled += Number(getValue(task, 'total-milled')) || Number(getValue(task, 'total-milled-rice')) || Number(getValue(task, 'totalOutput')) || 0;
        totalUnmilled += Number(getValue(task, 'total-unmilled')) || 0;
        totalBroken += Number(getValue(task, 'total-broken')) || 0;

        const hrLogs = task.hourlyLogs || getValue(task, 'hourlyLogs') || [];
        hrLogs.forEach((log, index) => {
            totalDowntime += Number(log.downtime) || 0;
            if (log.time || index >= 0) {
                yieldTrendData.push({
                    time: log.time || log.hour || `Hour ${index + 1}`,
                    milled: Number(log.milledRice) || Number(log.actualOutput) || 0,
                    paddy: Number(log.paddyFed) || 0,
                    yield: log.paddyFed ? ((Number(log.milledRice) || 0) / Number(log.paddyFed) * 100).toFixed(1) : 0
                });
            }
        });
    });

    return { totalMilled, totalUnmilled, totalBroken, totalDowntime, yieldTrendData };
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

    const transferTasks = tasks.filter(t => t.checklistType === 'hub-transfer-inspection' || t.checklistType === 'hubtransfer' || t.checklistType === 'hub-transfer');
    totalTrips = transferTasks.length;

    transferTasks.forEach(task => {
        const depTime = getValue(task, 'departure-time');
        if (depTime && depTime <= '08:30') {
            onTimeCount++;
        }

        const anomalies = getValue(task, 'anomalies-details') || getValue(task, 'discrepancy-details') || (getValue(task, 'anomalies-found') && 'Anomaly found at hub');
        if (anomalies) {
            incidentLog.push({
                id: task.id,
                date: task.submittedAt?.toDate ? format(task.submittedAt.toDate(), 'MMM dd, yyyy') : (task.timestamp?.toDate ? format(task.timestamp.toDate(), 'MMM dd, yyyy') : 'Recent'),
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
            existingHub.bagsTransferred += Number(getValue(task, 'bags-counted')) || Number(getValue(task, 'final-bag-count')) || 0;
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
