/**
 * Farmer list from GGEM export API (separate Firestore / cloud function).
 * Cached in memory for fast typeahead in aggregation log tables.
 */

const DEFAULT_URL =
    'https://us-central1-ggem-farming-4a93d.cloudfunctions.net/exportFarmers';

const API_URL = import.meta.env.VITE_FARMER_EXPORT_URL || DEFAULT_URL;

let registry = null;
let loadPromise = null;

export function farmerDisplayName(farmer) {
    if (!farmer) return '';
    const first = (farmer.firstName || '').trim();
    const last = (farmer.lastName || '').trim();
    return [first, last].filter(Boolean).join(' ').trim();
}

function normalizeFarmer(raw, index) {
    const displayName = farmerDisplayName(raw);
    return {
        id: raw.id || `farmer-${index}`,
        firstName: raw.firstName || '',
        lastName: raw.lastName || '',
        gender: raw.gender || '',
        displayName,
        searchText: `${displayName} ${raw.firstName || ''} ${raw.lastName || ''}`.toLowerCase(),
    };
}

/** Load full farmer list once per app session. */
export async function ensureFarmerRegistry() {
    if (registry) return registry;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        const res = await fetch(API_URL, { method: 'GET' });
        if (!res.ok) {
            throw new Error(`Farmer export failed (${res.status})`);
        }
        const data = await res.json();
        const list = Array.isArray(data?.farmers) ? data.farmers : [];
        registry = list.map(normalizeFarmer);
        return registry;
    })();

    try {
        return await loadPromise;
    } catch (err) {
        loadPromise = null;
        throw err;
    }
}

export function getFarmerRegistry() {
    return registry;
}

export function isFarmerRegistryLoaded() {
    return Array.isArray(registry) && registry.length > 0;
}

/** Typeahead search (min 2 characters). */
export function searchFarmers(term, limit = 12) {
    if (!registry?.length) return [];
    const q = (term || '').trim().toLowerCase();
    if (q.length < 2) return [];

    const out = [];
    for (const f of registry) {
        if (f.searchText.includes(q)) {
            out.push(f);
            if (out.length >= limit) break;
        }
    }
    return out;
}
