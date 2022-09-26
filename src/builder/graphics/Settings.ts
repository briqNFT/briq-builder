import { reactive, watchEffect } from 'vue';

import { logDebug } from '@/Messages';

class Settings {
    // If false, the changes are not serialised.
    saveActive = true;

    aaLevel!: '0' | 'FXAA' | 'SMAA' | '2' | '3' | '4';
    useSAO!: boolean;
    showBorders!: boolean;
    transparentBackground!: boolean;
    canvasSize!: number;

    constructor() {
        this.reset();
    }

    reset() {
        this.aaLevel = 'FXAA';
        this.useSAO = false;
        this.showBorders = false;
        this.transparentBackground = false;
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

    getSettingsForSetExport() {
        return {
            showBorders: this.showBorders,
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
