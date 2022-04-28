import { reactive, watchEffect, markRaw } from 'vue';

import { useDarkMode } from '@/DarkMode';
import { logDebug } from '@/Messages';

import { CONF } from '@/Conf';

class Settings {
    // If false, the changes are not serialised.
    saveActive = true;

    aaLevel!: '0' | 'FXAA' | '1' | '2' | '3' | '4';
    useSAO!: boolean;
    planeColor!: string;
    gridColor!: string;
    backgroundColor!: string;
    showBorders!: boolean;
    showPlane!: boolean;
    showGrid!: boolean;
    transparentBackground!: boolean;
    canvasSize!: number;
    lightColor!: string;
    ambientColor!: string;

    constructor() {
        this.reset();
    }

    reset() {
        this.aaLevel = 'FXAA';
        this.useSAO = false;
        // If you change these, change settings.vue
        this.planeColor = useDarkMode()
            ? CONF.builderSettings.darkMode.planeColor
            : CONF.builderSettings.lightMode.planeColor;
        this.gridColor = useDarkMode()
            ? CONF.builderSettings.darkMode.gridColor
            : CONF.builderSettings.lightMode.gridColor;
        this.backgroundColor = useDarkMode()
            ? CONF.builderSettings.darkMode.backgroundColor
            : CONF.builderSettings.lightMode.backgroundColor;
        this.showBorders = false;
        this.showPlane = true;
        this.showGrid = true;
        this.transparentBackground = false;
        this.canvasSize = CONF.builderSettings.canvasSize;
        this.lightColor = '#888888';
        this.ambientColor = '#888888';
    }

    parseStorage() {
        for (const key in this) {
            if (key === 'transparentBackground' || key === 'saveActive')
                continue;

            const val = window.localStorage.getItem('setting_' + key);
            if (val && key in this)
                this[key] = JSON.parse(val);
        }
    }

    /* Check if we need to update something */
    onDarkModeUpdate() {
        const light = CONF.builderSettings.lightMode;
        const dark = CONF.builderSettings.darkMode;
        if (
            useDarkMode() &&
            this.planeColor === light.planeColor &&
            this.gridColor === light.gridColor &&
            this.backgroundColor === light.backgroundColor
        ) {
            builderSettings.planeColor = dark.planeColor;
            builderSettings.gridColor = dark.gridColor;
            builderSettings.backgroundColor = dark.backgroundColor;
        } else if (
            !useDarkMode() &&
            this.planeColor === dark.planeColor &&
            this.gridColor === dark.gridColor &&
            this.backgroundColor === dark.backgroundColor
        ) {
            builderSettings.planeColor = light.planeColor;
            builderSettings.gridColor = light.gridColor;
            builderSettings.backgroundColor = light.backgroundColor;
        }
    }

    getSettingsForSetExport() {
        return {
            planeColor: this.planeColor,
            gridColor: this.gridColor,
            backgroundColor: this.backgroundColor,
            showBorders: this.showBorders,
            showPlane: this.showPlane,
            showGrid: this.showGrid,
            canvasSize: this.canvasSize,
            lightColor: this.lightColor,
            ambientColor: this.ambientColor,
        };
    }

    setSaveSettings(value: boolean) {
        this.saveActive = value;
    }

    saveSettings() {
        if (!this.saveActive)
            return;
        logDebug('SETTINGS - saving settings');
        for (const key in this)
            window.localStorage.setItem('setting_' + key, JSON.stringify(this[key]));
    }
}

const builderSettings = reactive(new Settings());
builderSettings.parseStorage();
watchEffect(() => builderSettings.saveSettings());
export default builderSettings;
