import { normalizeChecklistType } from '@/config/departments';
import { millingChecklistConfig } from '@/features/warehousing/config/millingChecklist';
import { briquetteChecklistConfig } from '@/features/warehousing/config/briquetteChecklist';
import { hubCollectionChecklistConfig } from '@/features/warehousing/config/hubCollectionChecklistConfig';
import { hubTransferChecklistConfig } from '@/features/warehousing/config/hubTransfer';
import { warehouseClosingChecklistConfig } from '@/features/warehousing/config/warehouseClosingChecklistConfig';
import { warehouseMaintenanceChecklistConfig } from '@/features/warehousing/config/warehouseMaintenanceChecklist';
import { warehouseInventoryChecklistConfig } from '@/features/warehousing/config/warehouseInventoryChecklist';
import { loadingDispatchChecklistConfig } from '@/features/warehousing/config/loadingProduceConfig';
import { outreachEngagementChecklistConfig } from '@/features/data-field/config/outreachEngagementChecklist';
import { salesMarketingChecklistConfig } from '@/features/data-field/config/salesMarketingChecklist';
import { fieldMonitoringQAChecklistConfig } from '@/features/data-field/config/Fieldmonitoringqachecklist';
import { dataCallCentreOversightChecklistConfig } from '@/features/data-field/config/Datacallcentreoversightchecklist';
import { preAggregationSetupConfig } from '@/features/aggregation/config/PreAggregationSetupChecklist';
import { qualityControlGradingConfig } from '@/features/aggregation/config/QualityControlGradingChecklist';
import { weighingRecordingConfig } from '@/features/aggregation/config/WeighingRecordingChecklist';
import { warehouseStockReceivingConfig } from '@/features/aggregation/config/WarehouseStockReceivingChecklist';
import { endOfDayReconciliationConfig } from '@/features/aggregation/config/EndofDayReconciliationChecklist';

const BY_TYPE = {
    milling: millingChecklistConfig,
    briquette: briquetteChecklistConfig,
    hubcollection: hubCollectionChecklistConfig,
    hubtransfer: hubTransferChecklistConfig,
    warehouseclosing: warehouseClosingChecklistConfig,
    warehousemaintenance: warehouseMaintenanceChecklistConfig,
    warehouseinventory: warehouseInventoryChecklistConfig,
    loading: loadingDispatchChecklistConfig,
    'outreach-engagement': outreachEngagementChecklistConfig,
    'sales-marketing': salesMarketingChecklistConfig,
    'field-monitoring-qa': fieldMonitoringQAChecklistConfig,
    'data-callcentre-oversight': dataCallCentreOversightChecklistConfig,
    'pre-aggregation-setup': preAggregationSetupConfig,
    'aggregation-quality-control': qualityControlGradingConfig,
    'aggregation-weighing-recording': weighingRecordingConfig,
    'aggregation-warehouse-receiving': warehouseStockReceivingConfig,
    'aggregation-end-of-day': endOfDayReconciliationConfig,
};

export function getChecklistConfig(checklistType) {
    if (!checklistType) return null;
    const normalized = normalizeChecklistType(checklistType);
    return BY_TYPE[normalized] || BY_TYPE[checklistType] || null;
}

export function getTaskProgressPercent(task) {
    const config = getChecklistConfig(task?.checklistType);
    if (!config?.sections?.length) return 0;

    const completedSections =
        task.completedSections ||
        task.checklistProgress?.completedSections ||
        [];

    const pct = Math.round((completedSections.length / config.sections.length) * 100);
    return Number.isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct));
}
