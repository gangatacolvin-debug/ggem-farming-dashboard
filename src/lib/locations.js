
export const GGEM_LOCATIONS = {
    // Main Production Facility
    'main-warehouse': {
        id: 'main-warehouse',
        name: 'GGEM Main Warehouse (gate 2)',
        latitude: -13.0710848,
        longitude: 34.2397767,
        type: 'warehouse',
        radius: 1500 // meters
    },

    // Regional Hubs (Replace with your actual hub coordinates)
    'dwangwa-hub': {
        id: 'dwangwa-hub',
        name: 'Dwangwa Hub',
        latitude: -13.0698277,
        longitude: 34.2399447,
        type: 'hub',
        radius: 1000 // meters
    },
    'linga-hub': {
        id: 'linga-hub',
        name: 'Linga Hub',
        latitude: -13.0698277,
        longitude: 34.2399447,
        type: 'hub',
        radius: 1000 // meters
    },
    'suluwi-hub': {
        id: 'suluwi-hub',
        name: 'SuluwiHub',
        latitude: -13.407304993923663,
        longitude: 34.27103024356882,
        type: 'hub',
        radius: 1000 // meters
    },
    'salima-hub': {
        id: 'salima-hub',
        name: 'salima Hub',
        latitude: -13.0698277,
        longitude: 34.2399447,
        type: 'hub',
        radius: 1000 // meters
    }
};

// Helper function
export const getHubLocations = () => {
    return Object.values(GGEM_LOCATIONS).filter(loc => loc.type === 'hub');
};