import { shallowReactive, reactive, watchEffect } from 'vue';

import { backendManager } from '@/Backend';
import { CHAIN_NETWORKS, getCurrentNetwork } from '@/chain/Network';
import { APP_ENV } from '@/Meta';

import { userBalance } from './UserBalance';
import * as starknet from 'starknet';
import { Fetchable, autoFetchable } from '@/DataFetching';

userBalance.setup();

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
            target[prop].fetch(() => propFactory((async () => (await promise)[prop])()));
            promise.then(x => {
                for (const k in x)
                    if (!target[k]) {
                        target[k] = new Fetchable<T>();
                        target[k].fetch(() => propFactory((async () => (await promise)[k])()));
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
        return starknet.number.toBN(this.initial_price);
    }
}


export class ThemeData {
    name!: string;
    tagline!: string;
    description!: string;
    sale_start?: number;

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


class GenesisStore {
    network = { dev: 'mock', test: 'starknet-testnet-dojo', prod: 'starknet' }[APP_ENV];
    _metadata = reactive({}) as { [box_uid: string]: Fetchable<BoxMetadata> };
    _saledata = reactive({}) as { [box_uid: string]: Fetchable<SaleData> };
    _boxes = reactive({}) as { [theme_uid: string]: Fetchable<string[]> };
    _themedata = reactive({}) as { [theme_uid: string]: Fetchable<ThemeData> };

    metadata!: { [box_uid: string]: Fetchable<BoxMetadata> };
    saledata!: { [box_uid: string]: Fetchable<SaleData> };
    boxes!: { [theme_uid: string]: Fetchable<string[]> };
    themedata!: { [theme_uid: string]: Fetchable<ThemeData> };


    init() {
        this.metadata = autoMultiFetchable(
            this._metadata,
            async (data: Promise<any>) => await data as BoxMetadata,
            // This leverages backend cache, so if we make the same request a lot (such as when loading the theme page) it only goes through once.
            async (prop) => await backendManager.fetch(`v1/box/data_all/${this.network}/${prop.split('/')[0]}`),
        );
        this.themedata = autoFetchable(this._themedata, async (theme_id) => new ThemeData(await backendManager.fetch(`v1/${this.network}/${theme_id}/data`)));
        this.boxes = autoFetchable(this._boxes as any, (theme_id) => backendManager.fetch(`v1/${this.network}/${theme_id}/boxes`));
        this.saledata = autoMultiFetchable(
            this._saledata,
            async (data: Promise<any>) => new SaleData(await data),
            // This leverages backend cache, so if we make the same request a lot (such as when loading the theme page) it only goes through once.
            async (prop) => await backendManager.fetch(`v1/${this.network}/${prop.split('/')[0]}/saledata`),
        );
    }

    coverItemRoute(booklet_id: string, lowQuality = false) {
        return backendManager.getRoute(`box/cover_item/${this.network}/${encodeURIComponent(booklet_id)}.${lowQuality ? 'jpg' : 'png'}`)
    }
    coverBoxRoute(booklet_id: string, lowQuality = false) {
        return backendManager.getRoute(`box/cover_box/${this.network}/${encodeURIComponent(booklet_id)}.${lowQuality ? 'jpg' : 'png'}`)
    }
    coverBookletRoute(booklet_id: string, lowQuality = false) {
        return backendManager.getRoute(`box/cover_booklet/${this.network}/${encodeURIComponent(booklet_id)}.${lowQuality ? 'jpg' : 'png'}`)
    }
    boxTexture(booklet_id: string) {
        return backendManager.getRoute(`box/texture/${this.network}/${encodeURIComponent(booklet_id)}.png`)
    }
    bookletTexture(booklet_id: string) {
        return backendManager.getRoute(`booklet/texture/${this.network}/${encodeURIComponent(booklet_id)}.png`)
    }

    setNetwork(network: CHAIN_NETWORKS) {
        this.network = network;
        this.refreshBoxes();
    }

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
    }
}

const genesisStore = shallowReactive(new GenesisStore());
genesisStore.init();

watchEffect(() => {
    const ntwk = getCurrentNetwork();
    if (genesisStore.network !== ntwk)
        genesisStore.setNetwork(ntwk);
})

export const useGenesisStore = () => genesisStore;
