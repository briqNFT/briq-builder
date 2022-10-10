import { reactive, WatchStopHandle } from 'vue';
import { SetData } from './SetData';
import { Briq } from './Briq';

import { hexUuid } from '../Uuid';

import { watchEffect } from 'vue';
import { logDebug } from '../Messages';

import { CONF } from '@/Conf';

import * as fflate from 'fflate';

export type SET_STATUS = 'ONCHAIN_ONLY' | 'ONCHAIN_LOADED' | 'ONCHAIN_EDITING' | 'LOCAL';

const SETINFO_VERSION = 2;

export class SetInfo {
    id: string;
    setData!: SetData;
    booklet: string | undefined;

    constructor(sid: string, setData?: SetData) {
        this.id = sid;
        if (setData)
            this.setData = setData;
    }

    serialize() {
        const raw = JSON.stringify(this.setData.serialize());
        // Use compression to get 10-20x size gains, since Chrome prevents local storage above 5MB.
        const data = fflate.strFromU8(fflate.zlibSync(fflate.strToU8(raw)), true);
        return {
            version: SETINFO_VERSION,
            id: this.id,
            booklet: this.booklet,
            setData: data,
        };
    }

    deserialize(data: any) {
        this.id = data.id;
        this.booklet = data?.booklet;

        try {
            const raw = fflate.strFromU8(fflate.unzlibSync(fflate.strToU8(data.setData, true)));
            this.setData = new SetData(data.id).deserialize(JSON.parse(raw));
        } catch(_) {
            // used for tests
            this.setData = new SetData(data.id).deserialize(data.setData);
        }

        // TODO: check coherence.
        return this;
    }

    getSet() {
        return this.setData;
    }

    setLocal(set: SetData) {
        this.setData = set;
        return this;
    }
}

export class SetsManager {
    setList: Array<string> = [];
    setsInfo: { [setId: string]: SetInfo } = {};

    clear() {
        this.setList.splice(0, this.setList.length);
        for (const key in this.setsInfo)
            delete this.setsInfo[key];
    }

    /**
     * Load all sets from local storage. Note that this doesn't clear any preloaded sets (such as on-chain ones).
     */
    async loadFromStorage() {
        for (const [sid, setData] of Object.entries(window.localStorage)) {
            if (!sid.startsWith('briq_set'))
                continue;
            try {
                const data = JSON.parse(setData);
                const info = new SetInfo(sid).deserialize(data);
                this.setList.push(info.id);
                this.setsInfo[info.id] = info;
            } catch (e) {
                console.info('Could not parse stored set', sid, 'error:', e);
                window.localStorage.removeItem(sid);
            }
        }
    }

    getInfo(sid: string) {
        return this.setsInfo[sid];
    }

    getBookletSet(booklet_id: string) {
        for (const sid in this.setsInfo)
            if (this.setsInfo[sid].booklet === booklet_id)
                return this.setsInfo[sid].getSet();
    }

    /**
     * Return a random local set. Used to easily query a local set, since the builder needs to always have one for now.
     * @returns a local set, or undefined if none exist.
     */
    getLocalSet() {
        console.log(this.setsInfo);
        for (const sid in this.setsInfo)
            if (!this.setsInfo[sid].booklet)
                return this.setsInfo[sid].setData;
    }

    createLocalSet() {
        const set = new SetData(hexUuid());
        set.name = 'New Set';
        this.registerLocalSet(set);
        return set;
    }

    /**
     * Register a new local set.
     */
    registerLocalSet(set: SetData) {
        if (this.setsInfo[set.id])
            throw new Error('Set with ID ' + set.id + ' already exists');
        this.setsInfo[set.id] = new SetInfo(set.id, set);
        this.setList.push(set.id);
        return this.setsInfo[set.id];
    }

    /**
     * Delete the local copy of a set.
     * @param sid ID of the set.
     */
    deleteLocalSet(sid: string) {
        const data = this.setsInfo[sid];
        if (!data)
            return;
        const idx = this.setList.indexOf(sid);
        this.setList.splice(idx, 1);
        delete this.setsInfo[sid];
        // Delete localstorage after for it may have been reloaded otherwise.
        window.localStorage.removeItem('briq_set_' + sid);
    }

    duplicateLocally(set: SetData) {
        const copy = setsManager.createLocalSet();
        const data = set.serialize();
        delete data.id;
        copy.deserialize(data);
        copy.name = `Copy of ${copy.getName()}`
        return copy;
    }

    onSetMinted(oldSetId: string | null, newSet: SetData) {
        const idx = this.setList.indexOf(oldSetId || '');
        if (idx !== -1) {
            this.setList.splice(idx, 1, newSet.id);
            this.setsInfo[newSet.id] = this.setsInfo[oldSetId!];
            this.setsInfo[newSet.id].id = newSet.id;
            delete this.setsInfo[oldSetId!];
        } else
            this.setsInfo[newSet.id] = new SetInfo(newSet.id);

        this.setsInfo[newSet.id].setData = newSet;

        return this.setsInfo[newSet.id];
    }
}

const storageHandlers: { [sid: string]: WatchStopHandle } = {};
export function synchronizeSetsLocally() {
    for (const sid in setsManager.setsInfo) {
        if (storageHandlers[sid])
            continue;
        storageHandlers[sid] = watchEffect(() => {
            const info = setsManager.setsInfo[sid];
            logDebug('SET STORAGE HANDLER - Serializing set ', sid);
            if (!info) {
                // Delete
                if (window.localStorage.getItem('briq_set_' + sid)) {
                    logDebug('SET STORAGE HANDLER - deleted local set', sid);
                    window.localStorage.removeItem('briq_set_' + sid);
                }
                if (!info) {
                    logDebug('SET STORAGE HANDLER - unwatching ', sid);
                    storageHandlers[sid]();
                    delete storageHandlers[sid];
                }
                return;
            }
            window.localStorage.setItem('briq_set_' + sid, JSON.stringify(info.serialize()));
        });
    }
}

export const setsManager = reactive(new SetsManager());
setsManager.loadFromStorage();
watchEffect(() => synchronizeSetsLocally());


import { defaultModel } from '@/conf/realms';

// TODO: move this elsewhere?
export function checkForInitialGMSet() {
    if (setsManager.setList.length)
        return;
    if (!window.localStorage.getItem('has_initial_gm_set')) {
        window.localStorage.setItem('has_initial_gm_set', 'true');
        const set = new SetData(hexUuid());
        set.name = 'GM';
        const data: { pos: [number, number, number]; color: string }[] =
            CONF.theme === 'realms'
                ? defaultModel
                : [
                    { pos: [4, 0, 0], color: '#c5ac73' },
                    { pos: [3, 0, 0], color: '#c5ac73' },
                    { pos: [2, 0, 0], color: '#c5ac73' },
                    { pos: [1, 0, 0], color: '#c5ac73' },
                    { pos: [1, 1, 0], color: '#e6de83' },
                    { pos: [1, 2, 0], color: '#e6de83' },
                    { pos: [2, 2, 0], color: '#e6de83' },
                    { pos: [4, 1, 0], color: '#62bdf6' },
                    { pos: [4, 2, 0], color: '#62bdf6' },
                    { pos: [4, 3, 0], color: '#62bdf6' },
                    { pos: [4, 4, 0], color: '#e6de83' },
                    { pos: [3, 4, 0], color: '#416aac' },
                    { pos: [2, 4, 0], color: '#416aac' },
                    { pos: [1, 4, 0], color: '#416aac' },
                    { pos: [-1, 0, 0], color: '#394183' },
                    { pos: [-5, 0, 0], color: '#416aac' },
                    { pos: [-5, 1, 0], color: '#416aac' },
                    { pos: [-5, 2, 0], color: '#416aac' },
                    { pos: [-5, 3, 0], color: '#416aac' },
                    { pos: [-5, 4, 0], color: '#416aac' },
                    { pos: [-1, 1, 0], color: '#394183' },
                    { pos: [-1, 2, 0], color: '#394183' },
                    { pos: [-1, 3, 0], color: '#394183' },
                    { pos: [-1, 4, 0], color: '#394183' },
                    { pos: [-2, 4, 0], color: '#e6de83' },
                    { pos: [-4, 4, 0], color: '#e6de83' },
                    { pos: [-3, 3, 0], color: '#c5ac73' },
                ];
        for (const briqData of data)
            set.placeBriq(...briqData.pos, new Briq(CONF.defaultMaterial, briqData.color));
        setsManager.registerLocalSet(set);
        return set;
    }
}
