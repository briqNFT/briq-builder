import type { SetData } from './SetData';

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
    colors: { [key: string]: string } = {};

    constructor()
    {
        this.colors = Object.assign({}, DEFAULT_COLORS);
    }

    serialize()
    {

    }

    deserialize()
    {
        
    }

    reset()
    {
        this.colors = Object.assign({}, DEFAULT_COLORS);
    }

    getFirstColor()
    {
        return Object.keys(this.colors)[0];
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

import { reactive } from 'vue';
export var palettesMgr = reactive(new PalettesManager());
