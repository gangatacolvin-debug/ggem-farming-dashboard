
export const GGEM_LOCATIONS = {
    // Main Production Facility
    'main-warehouse': {
        id: 'main-warehouse',
        name: 'GGEM Main Warehouse (Briquette Production)',
        latitude: -13.0710848,
        longitude: 34.2397767,
        type: 'warehouse'
    },

    // Regional Hubs (Replace with your actual hub coordinates)
    'dwangwa-hub': {
        id: 'dwangwa-hub',
        name: 'Dwangwa Hub',
        latitude: -13.0698277,
        longitude: 34.2399447,
        type: 'hub'
    },
    'linga-hub': {
        id: 'linga-hub',
        name: 'Linga Hub',
        latitude: -13.0698277,
        longitude: 34.2399447,
        type: 'hub'
    },
    'suluwi-hub': {
        id: 'suluwi-hub',
        name: 'SuluwiHub',
        latitude: -13.407304993923663,
        longitude: 34.27103024356882,
        type: 'hub'
    },
    'salima-hub': {
        id: 'salima-hub',
        name: 'salima Hub',
        latitude: -13.0698277,
        longitude: 34.2399447,
        type: 'hub'
    }
};

// Helper function
export const getHubLocations = () => {
    return Object.values(GGEM_LOCATIONS).filter(loc => loc.type === 'hub');
};