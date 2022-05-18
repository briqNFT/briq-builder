import unique from '@/assets/materials/unique.png';
import standard from '@/assets/materials/standard.svg';
import limited from '@/assets/materials/limited.svg';
import rare from '@/assets/materials/limited.svg';
import ultrarare from '@/assets/materials/limited.svg';

import { h } from 'vue';

export default {
    '0x1': {
        name: 'Standard',
        icon: standard,
        css: (color: string) => ({
            backgroundColor: color,
        }),
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
        icon: limited,
        css: (color: string) => ({
            background: `repeating-linear-gradient(
                -70deg,
                ${color},
                ${color} 10px,
                ${color}B0 10px,
                ${color}B0 15px
            )`,
        }),
        material: {
            opacity: 0.5,
            metalness: 0,
            roughness: 0,
            emissiveIntensity: 0,
        },
    },
    '0x4': {
        name: 'Rare',
        icon: rare,
        css: (color: string) => ({
            background: `repeating-linear-gradient(
                40deg,
                ${color},
                #FFFFFF 20px,
                ${color} 25px,
                ${color} 100%
            )`,
        }),
        material: {
            opacity: 1.0,
            metalness: 0.5,
            roughness: 0.15,
            emissiveIntensity: 0,
        },
    },
    '0x5': {
        name: 'Ultra-rare',
        icon: ultrarare,
        material: {
            emissiveIntensity: 0.8,
        },
    },
    '0x6': {
        name: 'Unique',
        icon: h('img', { src: unique }),
    },
};
