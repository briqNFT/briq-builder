import { reactive, watchEffect, markRaw } from 'vue';

import { useDarkMode } from '../../DarkMode';
import { logDebug } from '../../Messages';

class Settings
{
    // If false, the changes are not serialised.
    saveActive = true;

    useSAO!: boolean;
    useRealAA!: boolean;
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

    constructor()
    {
        this.reset();
    }

    reset()
    {
        this.useSAO = false;
        this.useRealAA = false;
        // If you change these, change settings.vue
        this.planeColor = useDarkMode() ? "#591f00" : "#a93a00";
        this.gridColor = useDarkMode() ? "#999999" : "#eaeaea";
        this.backgroundColor = useDarkMode() ? "#1e2229" : "#eaeaea";
        this.showBorders = false;
        this.showPlane = true;
        this.showGrid = true;
        this.transparentBackground = false;
        this.canvasSize = 10;
        this.lightColor = "#888888";
        this.ambientColor = "#888888";
    }

    parseStorage()
    {
        for (let key in this)
        {
            if (key === "transparentBackground" || key === "saveActive")
                continue;

            let val = window.localStorage.getItem("setting_" + key);
            if (val)
                this[key] = JSON.parse(val);
        }
    }

    getSettingsForSetExport()
    {
        return {
            "planeColor": this.planeColor,
            "gridColor": this.gridColor,
            "backgroundColor": this.backgroundColor,
            "showBorders": this.showBorders,
            "showPlane": this.showPlane,
            "showGrid": this.showGrid,
            "canvasSize": this.canvasSize,
            "lightColor": this.lightColor,
            "ambientColor": this.ambientColor,
        }
    }

    setSaveSettings(value: boolean)
    {
        this.saveActive = value;
    }

    saveSettings()
    {
        if (!this.saveActive)
            return;
        logDebug("SETTINGS - saving settings");
        for (let key in this)
            window.localStorage.setItem("setting_" + key, JSON.stringify(this[key]));
    }
}

const builderSettings =  reactive(new Settings());
builderSettings.parseStorage();
watchEffect(() => builderSettings.saveSettings());
export default builderSettings;
