import './default.css';

import { APP_ENV } from '@/Meta';

export const MATERIAL_GENESIS = '0x1';

export const CONF = {
    theme: 'default',
    useLanding: true,
    briqMaterials: APP_ENV === 'dev' ? ['0x1', '0x3', '0x4', '0x5', '0x6'] : ['0x1'],
    defaultMaterial: MATERIAL_GENESIS,
    builderSettings: {
        darkMode: {
            planeColor: '#591f00',
            gridColor: '#999999',
            backgroundColor: '#1e2229',
        },
        lightMode: {
            planeColor: '#a93a00',
            gridColor: '#eaeaea',
            backgroundColor: '#eaeaea',
        },
        canvasSize: 10,
        maxCanvasSize: 50,
    },
    defaultPalette: {
        // Default colours come from #138
        '#c5ac73': '#c5ac73',
        '#e6de83': '#e6de83',
        '#625231': '#625231',
        '#399ccd': '#399ccd',
        '#62bdf6': '#62bdf6',
        '#ffeec5': '#ffeec5',
        '#416aac': '#416aac',
        '#394183': '#394183',
        '#c5c5c5': '#c5c5c5',
        '#ffffff': '#ffffff',
        '#6a6a6a': '#6a6a6a',
    },
};
