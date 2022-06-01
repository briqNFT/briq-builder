import './default.css';

import { APP_ENV } from '@/Meta';

export const MATERIAL_GENESIS = '0x1';

export const CONF = {
    theme: 'default',
    briqMaterials: ['0x1', '0x3', '0x4', '0x5', '0x6'],
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
        '0x1#c5ac73': '#c5ac73',
        '0x1#e6de83': '#e6de83',
        '0x1#625231': '#625231',
        '0x1#399ccd': '#399ccd',
        '0x1#62bdf6': '#62bdf6',
        '0x1#ffeec5': '#ffeec5',
        '0x1#416aac': '#416aac',
        '0x1#394183': '#394183',
        '0x1#c5c5c5': '#c5c5c5',
        '0x1#ffffff': '#ffffff',
        '0x1#6a6a6a': '#6a6a6a',
    },
};
