import { computed, watchEffect } from 'vue';

import { defineStore } from 'pinia'
import { backendManager } from '@/Backend';
import { CHAIN_NETWORKS, getCurrentNetwork } from '@/chain/Network';
import { APP_ENV } from '@/Meta';

import { userBalance } from './UserBalance';
import { toBN } from 'starknet/utils/number';

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

    clear() {
        this._data = undefined;
        this._fetch = undefined;
    }
}

export const autoFetchable = <T>(wraps: { [prop: string]: Fetchable<T> }, t: (prop: string) => Promise<T>) => {
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

const autoMultiFetchable = <T>(
    wraps: { [prop: string]: Fetchable<T> },
    propFactory: (data: Promise<unknown>) => Promise<T>,
    multiQuery: (prop: string) => Promise<{ [prop: string]: unknown }>,
) => {
    return new Proxy(wraps, {
        get: (target, prop: string, receiver): Fetchable<T> => {
            if (Reflect.has(target, prop))
                return Reflect.get(target, prop, receiver);

            const promise = multiQuery(prop);
            target[prop] = new Fetchable<T>();
            target[prop].fetch(propFactory((async () => (await promise)[prop])()));
            promise.then(x => {
                for (const k in x)
                    if (!target[k]) {
                        target[k] = new Fetchable<T>();
                        target[k].fetch(propFactory((async () => (await promise)[k])()));
                    }
            });
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
    quantity_left_pending?: number;
    auction_start!: number;
    auction_duration!: number;
    initial_price!: string;
    wave?: string;

    constructor(saledata: any) {
        for (const key in saledata)
            this[key] = saledata[key];
        if (this.quantity_left_pending && this.quantity_left_pending < this.quantity_left)
            this.quantity_left = this.quantity_left_pending;
    }

    startIn() {
        return this.auction_start - Date.now() / 1000;
    }

    durationLeft() {
        return this.auction_start + this.auction_duration - Date.now() / 1000;
    }

    isLive() {
        return this.auction_start < Date.now() / 1000.0 && this.durationLeft() > 0;
    }

    get price() {
        return toBN(this.initial_price);
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
    nb_briqs: number;
    nb_briqs_extra: number;
    properties: Record<string, any>;
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
                return autoMultiFetchable(
                    state._metadata,
                    async (data: Promise<any>) => await data as BoxMetadata,
                    // This leverages backend cache, so if we make the same request a lot (such as when loading the theme page) it only goes through once.
                    async (prop) => await backendManager.fetch(`v1/box/data_all/${state.network}/${prop.split('/')[0]}`),
                );
                return autoFetchable<BoxMetadata>(state._metadata, (prop) => backendManager.fetch(`v1/box/data/${state.network}/${prop}.json`));
            },
            themedata(state) {
                return autoFetchable(state._themedata, async (theme_id) => new ThemeData(await backendManager.fetch(`v1/${state.network}/${theme_id}/data`)));
            },
            boxes(state) {
                return autoFetchable(state._boxes as any, (theme_id) => backendManager.fetch(`v1/${state.network}/${theme_id}/boxes`));
            },
            saledata(state) {
                return autoMultiFetchable(
                    state._saledata,
                    async (data: Promise<any>) => new SaleData(await data),
                    // This leverages backend cache, so if we make the same request a lot (such as when loading the theme page) it only goes through once.
                    async (prop) => await backendManager.fetch(`v1/${state.network}/${prop.split('/')[0]}/saledata`),
                );
            },
            coverItemRoute() {
                return (token_id: string, lowQuality = false) => computed(() => {
                    return backendManager.getRoute(`box/cover_item/${this.network}/${token_id}.${lowQuality ? 'jpg' : 'png'}`)
                }).value;
            },
            coverBoxRoute() {
                return (token_id: string, lowQuality = false) => computed(() => {
                    return backendManager.getRoute(`box/cover_box/${this.network}/${token_id}.${lowQuality ? 'jpg' : 'png'}`)
                }).value;
            },
            coverBookletRoute() {
                return (token_id: string, lowQuality = false) => computed(() => {
                    return backendManager.getRoute(`box/cover_booklet/${this.network}/${token_id}.${lowQuality ? 'jpg' : 'png'}`)
                }).value;
            },
            boxTexture() {
                return (token_id: string) => computed(() => {
                    return backendManager.getRoute(`box/texture/${this.network}/${token_id}.png`)
                }).value;
            },
            bookletTexture() {
                return (token_id: string) => computed(() => {
                    return backendManager.getRoute(`booklet/texture/${this.network}/${token_id}.png`)
                }).value;
            },
        },
        actions: {
            setNetwork(network: CHAIN_NETWORKS) {
                this.network = network;
                this.refreshBoxes();
            },
            refreshBoxes() {
                for (const key in this._themedata)
                    delete this._themedata[key];
                for (const key in this._boxes)
                    delete this._boxes[key];
                for (const key in this._saledata)
                    delete this._saledata[key];
                for (const key in this._metadata)
                    delete this._metadata[key];
                for (const key in this._boxes)
                    delete this._boxes[key];
                //autoFetchable(this._boxes as any, (theme_id) => backendManager.fetch(`v1/${this.network}/${theme_id}/boxes`));
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
