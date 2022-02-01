import type { SetData } from './SetData';

import { reactive, watchEffect } from 'vue';

const DEFAULT_COLORS = {
    "#c5ac73": "#c5ac73",
    "#e6de83": "#e6de83",
    "#625231": "#625231",
    "#399ccd": "#399ccd",
    "#62bdf6": "#62bdf6",
    "#ffeec5": "#ffeec5",
    "#416aac": "#416aac",
    "#394183": "#394183",
    "#c5c5c5": "#c5c5c5",
    "#ffffff": "#ffffff",
    "#6a6a6a": "#6a6a6a",
}

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
        window.localStorage.setItem("palette", JSON.stringify(this.colors));
    }

    deserialize()
    {
        this.reset(false);
        try {
            Object.assign(this.colors, JSON.parse(window.localStorage.getItem("palette")!));
        }
        catch(_)
        {
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
