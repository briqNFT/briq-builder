import { computed, watchEffect } from 'vue';

import { defineStore } from 'pinia'
import { backendManager } from '@/Backend';
import { CHAIN_NETWORKS, getCurrentNetwork } from '@/chain/Network';
import { APP_ENV } from '@/Meta';

import { userBalance } from './UserBalance';
import { number } from 'starknet';

userBalance.setup();

// TODO: I am reinventing graphQL only slower I think.

export class Fetchable<T> {
    _data = undefined as undefined | T;
    _fetch = undefined as undefined | Promise<T>;
    _error = undefined as any;

    get _status() {
        return this._data !== undefined ? 'LOADED' : (this._error !== undefined ? 'ERROR' : 'FETCHING');
    }

    async fetch(t: Promise<T>) {
        try {
            this._fetch = t;
            this._data = await this._fetch;
        } catch(err) {
            this._error = err;
        }
    }
}

const autoFetchable = <T>(wraps: { [prop: string]: Fetchable<T> }, t: (prop: string) => Promise<T>) => {
    return new Proxy(wraps, {
        get: (target, prop: string, receiver): Fetchable<T> => {
            if (Reflect.has(target, prop))
                return Reflect.get(target, prop, receiver);
            target[prop] = new Fetchable<T>();
            target[prop].fetch(t(prop));
            return target[prop];
        },
        set: (target, prop, value) => {
            return Reflect.set(target, prop, value);
        },
    });
}


export class SaleData {
    total_quantity!: number;
    quantity_left!: number;
    auction_start!: number;
    auction_duration!: number;
    initial_price!: string;

    constructor(saledata: any) {
        for (const key in saledata)
            this[key] = saledata[key];
    }

    durationLeft() {
        return this.auction_start + this.auction_duration - Date.now() / 1000;
    }

    isLive() {
        return this.auction_start < Date.now() / 1000.0 && this.durationLeft() > 0;
    }

    get price() {
        const timePercent = this.durationLeft() / this.auction_duration;
        // TODO: this has to be BN
        return this.initial_price * timePercent;
    }
}


export class ThemeData {
    name!: string;
    tagline!: string;
    description!: string;

    constructor(themeData: any) {
        for (const key in themeData)
            this[key] = themeData[key];
    }
}

export interface BoxMetadata {
    name: string;
    description: string;
    auction_id: number;
    token_id: number;
    briqs: any[];
    nb_pages: number;
    version: number;
}


let initialCall = () => {
    const useStore = defineStore('genesis_data', {
        state: () => {
            return {
                network: { dev: 'mock', test: 'starknet-testnet', prod: 'starknet' }[APP_ENV],
                _metadata: {} as { [box_uid: string]: Fetchable<BoxMetadata> },
                _saledata: {} as { [box_uid: string]: Fetchable<SaleData> },
                _boxes: {} as { [theme_uid: string]: Fetchable<string[]> },
                _themedata: {} as { [theme_uid: string]: Fetchable<ThemeData> },
            }
        },
        getters: {
            metadata(state) {
                return autoFetchable<BoxMetadata>(state._metadata, (prop) => backendManager.fetch(`v1/box/data/${state.network}/${prop}.json`));
            },
            themedata(state) {
                return autoFetchable(state._themedata, async (theme_id) => new ThemeData(await backendManager.fetch(`v1/${state.network}/${theme_id}/data`)));
            },
            boxes(state) {
                return autoFetchable(state._boxes as any, (theme_id) => backendManager.fetch(`v1/${state.network}/${theme_id}/boxes`));
            },
            saledata(state) {
                return autoFetchable(state._saledata, async (prop) => new SaleData(await backendManager.fetch(`v1/${state.network}/${prop}/saledata`)));
            },
            coverItemRoute() {
                return (token_id: string) => computed(() => {
                    return backendManager.getRoute(`box/cover_item/${this.network}/${token_id}.png`)
                }).value;
            },
            coverBoxRoute() {
                return (token_id: string) => computed(() => {
                    return backendManager.getRoute(`box/cover_box/${this.network}/${token_id}.png`)
                }).value;
            },
            coverBookletRoute() {
                return (token_id: string) => computed(() => {
                    return backendManager.getRoute(`box/cover_booklet/${this.network}/${token_id}.png`)
                }).value;
            },
            boxTexture() {
                return (token_id: string) => computed(() => {
                    return backendManager.getRoute(`box/texture/${this.network}/${token_id}.png`)
                }).value;
            },
        },
        actions: {
            setNetwork(network: CHAIN_NETWORKS) {
                this.network = network;
                for (const key in this._metadata)
                    delete this._metadata[key];
            },
        },
    })
    watchEffect(() => {
        const store = useStore();
        const ntwk = getCurrentNetwork();
        if (store.network !== ntwk)
            store.setNetwork(ntwk);
    })
    initialCall = useStore;
    return useStore();
}

export const useGenesisStore = initialCall;
