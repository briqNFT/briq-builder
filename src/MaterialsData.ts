export default {
    '0x1': {
        name: 'Standard',
        css: (color: string) => ({ backgroundColor: color }),
        material: {
            opacity: 1,
            metalness: 0,
            roughness: 0,
            emissiveIntensity: 0,
        },
    },
    '0x2': {
        name: 'Realms',
        material: {
            opacity: 1,
            metalness: 0,
            roughness: 0,
            emissiveIntensity: 0,
        },
    },
    '0x3': {
        name: 'Limited',
        material: {
            opacity: 0.5,
            metalness: 0,
            roughness: 0,
            emissiveIntensity: 0,
        },
    },
    '0x4': {
        name: 'Rare',
        material: {
            opacity: 1.0,
            metalness: 0.5,
            roughness: 0.15,
            emissiveIntensity: 0,
        },
    },
    '0x5': {
        name: 'Ultra-rare',
        material: {
            emissiveIntensity: 0.8,
        },
    },
    '0x6': {
        name: 'Unique',
    },
};
