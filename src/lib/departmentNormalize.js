import { DEPARTMENTS_CONFIG } from '@/config/departments';

/**
 * Maps Firestore/user department strings (e.g. warehousing, data-and-field)
 * to canonical ids from DEPARTMENTS_CONFIG (warehouse, data-field, aggregation).
 */
export function normalizeDepartment(dept) {
  const raw = String(dept || '').toLowerCase().trim();
  if (!raw) return '';

  for (const config of DEPARTMENTS_CONFIG) {
    const configId = config.id.toLowerCase();
    const configName = config.name.toLowerCase();

    if (
      raw === configId ||
      raw === configName ||
      configId.includes(raw) ||
      configName.includes(raw) ||
      raw.includes(configId.replace('-', '')) ||
      (raw.includes('warehous') && configId === 'warehouse') ||
      ((raw.includes('data') || raw.includes('field')) && configId === 'data-field') ||
      (raw.includes('aggregat') && configId === 'aggregation')
    ) {
      return config.id;
    }
  }

  return raw;
}
