import type { SetData } from './SetData';

import { reactive, watchEffect } from 'vue';
import { logDebug } from '../Messages';

import { CONF } from '@/Conf';

const DEFAULT_COLORS = CONF.defaultPalette;

const PALETTE_VERSION = 2;

export function unpackPaletteChoice(key: string) {
    return {
        material: key.slice(0, -7),
        color: key.slice(-7),
    };
}

export function packPaletteChoice(material: string, color: string) {
    return `${material}${color}`;
}

class Palette {

    choices: string[] = [];
    names: { [key: string]: string } = {};

    init() {
        this.deserialize();
        watchEffect(() => {
            this.serialize();
        });
    }

    serialize() {
        window.localStorage.setItem(
            'palette',
            JSON.stringify({
                version: PALETTE_VERSION,
                choices: this.choices,
                names: this.names,
            }),
        );
    }

    deserialize() {
        this.reset(false);
        try {
            const data = JSON.parse(window.localStorage.getItem('palette')!);
            if (data.version === 2) {
                Object.assign(this.choices, data.choices);
                Object.assign(this.names, data.names);
            }
            if (!this.choices.length) {
                logDebug('PALETTE - resetting colors as none were found.');
                this.reset();
            }
        } catch (_) {
            logDebug('PALETTE - resetting colors following unknown errors.');
            this.reset();
        }
    }

    reset(addDefault = true) {
        this.choices.length = 0;

        if (addDefault) {
            this.choices = this.choices.concat(Object.keys(DEFAULT_COLORS));
            Object.assign(this.names, DEFAULT_COLORS);
        }
    }

    getChoices() {
        return this.choices.map(key => [key, ...Object.values(unpackPaletteChoice(key)), this.names[key]]);
    }

    getNbChoices() {
        return this.choices.length;
    }

    getFirstChoice() {
        return unpackPaletteChoice(this.choices[0]);
    }

    getKey(choice: { material: string, color: string } | { key: string }) {
        return 'key' in choice ? choice.key : packPaletteChoice(choice.material, choice.color);
    }

    addChoice(choice: { material: string, color: string } | { key: string }, name: string): boolean {
        const key = this.getKey(choice);
        const idx = this.choices.indexOf(key);
        if (idx !== -1)
            return false;
        this.choices.push(key);
        this.names[key] = name;
        return true;
    }

    deleteChoice(choice: { material: string, color: string } | { key: string }) {
        const key = this.getKey(choice);
        const idx = this.choices.indexOf(key);
        if (idx !== -1)
            this.choices.splice(idx, 1);
    }

    swapChoice(old_choice: { material: string, color: string } | { key: string }, new_choice: { material: string, color: string } | { key: string })
    {
        const old_key = this.getKey(old_choice);
        const new_key = this.getKey(new_choice);
        const idx = this.choices.indexOf(old_key);
        if (idx !== -1)
            this.choices.splice(idx, 1, new_key);
        else
            throw new Error(`Key ${old_key} not found in palette`);
        delete this.names[old_key];
        this.names[new_key] = new_key;
    }

    /**
     * Add colors from the set missing in the palette.
     * @param set - the set to update against
     */
    updateForSet(set: SetData) {
        /*set.forEach((cell, _) => {
            const v = packPaletteChoice(cell.material, cell.color);
            if (v in this.colors)
                return;
            this.colors[v] = cell.color;
        });*/
    }
}

class PalettesManager {
    palettes: Array<Palette> = [];
    currentPalette = 0;

    init() {
        this.palettes.push(new Palette());
        this.palettes[0].init();
        return this;
    }

    getCurrent() {
        return this.palettes[this.currentPalette];
    }

    updateForSet(set: SetData) {
        this.getCurrent().updateForSet(set);
    }
}

export const palettesMgr = reactive(new PalettesManager()).init();