import type { SetData } from './SetData';

import { reactive, watchEffect } from 'vue';
import { logDebug } from '../Messages';

import { CONF } from '@/Conf';

const DEFAULT_COLORS = CONF.defaultPalette;

class Palette
{
    // Color - name
    colors: { [key: string]: string };

    constructor()
    {
        this.colors = reactive({});
        this.deserialize();
        watchEffect(() => {
            this.serialize();
        })
    }

    serialize()
    {
        window.localStorage.setItem("palette", JSON.stringify({
            "version": 1,
            "colors": this.colors,
        }));
    }

    deserialize()
    {
        this.reset(false);
        try {
            let data = JSON.parse(window.localStorage.getItem("palette")!);
            if (data.version)
                Object.assign(this.colors, data.colors);
            else
                Object.assign(this.colors, data);
            if (!Object.keys(this.colors).length)
            {
                logDebug("PALETTE - resetting colors as none were found.");
                this.reset();
            }
        }
        catch(_)
        {
            logDebug("PALETTE - resetting colors following unknown errors.");
            this.reset();
        }
    }

    reset(addDefault = true)
    {
        for (const col of Object.getOwnPropertyNames(this.colors)) {
            delete this.colors[col];
        }
        if (addDefault)
            Object.assign(this.colors, DEFAULT_COLORS);
    }

    getNbColors()
    {
        return Object.keys(this.colors).length;
    }

    getFirstColor()
    {
        return Object.keys(this.colors)[0];
    }

    deleteColor(hex: string)
    {
        delete this.colors[hex];
    }

    addColor(hex: string, name: string): boolean
    {
        if (this.colors[hex])
            return false;
        this.colors[hex] = name;
        return true;
    }

    /**
     * Add colors from the set missing in the palette.
     * @param set - the set to update against
     */
    updateForSet(set: SetData) {
        set.forEach((cell, _) => {
            if (cell.color in this.colors)
                return;
            this.colors[cell.color] = cell.color;
        });
    }
}

class PalettesManager
{
    palettes: Array<Palette> = [];
    currentPalette: number = 0;
    constructor()
    {
        this.palettes.push(new Palette());
    }

    getCurrent()
    {
        return this.palettes[this.currentPalette];
    }

    updateForSet(set: SetData)
    {
        this.getCurrent().updateForSet(set);
    }
}

export var palettesMgr = reactive(new PalettesManager());
