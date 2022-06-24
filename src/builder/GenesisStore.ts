import { computed, reactive, toRef, watch, watchEffect } from 'vue';

import type { WalletStore } from '@/chain/Wallet';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';

import { defineStore } from 'pinia'
import { backendManager } from '@/Backend';
import { CHAIN_NETWORKS, getCurrentNetwork } from '@/chain/Network';
import { APP_ENV } from '@/Meta';


class PerUser<Data> {
    _type: new () => Data;
    _perWallet = {} as { [wallet: string]: Data };
    _currentWallet = undefined as undefined | string;
    constructor(type: new () => Data) {
        this._type = type;
    }

    _initialise(walletStore: WalletStore) {
        watch([toRef(walletStore, 'userWalletAddress')], () => {
            if (this._currentWallet === walletStore.userWalletAddress)
                return;
            console.log('tatara', this);
            if (!(walletStore.userWalletAddress in this._perWallet))
                this._perWallet[walletStore.userWalletAddress] = new this._type();
            this._currentWallet = walletStore.userWalletAddress;
            console.log('tatara', 'set a new value');
        }, {
            immediate: true,
        })
    }
}

const perUserProxyFactory = <Data>(type: new () => Data) => new Proxy(reactive(new PerUser(type)), {
    get(target: PerUser<Data>, prop: string, receiver: any) {
        if (target._perWallet[target._currentWallet!] && prop in target._perWallet[target._currentWallet!])
            return target._perWallet[target._currentWallet!][prop];
        return Reflect.get(target, prop, receiver);
    },
    set(target: PerUser<Data>, prop: string, value: any, receiver: any) {
        if (target._perWallet[target._currentWallet!] && prop in target._perWallet[target._currentWallet!])
            return Reflect.set(target._perWallet[target._currentWallet!], prop, value);
        return Reflect.set(target, prop, value, receiver);
    },
}) as Data & PerUser<Data>;

class GenesisUserStore {
    availableBoxes = [] as string[];

    async fetchData() {
        const contractStore = (await import('@/Dispatch')).contractStore;
        await walletInitComplete;
        this.availableBoxes = await contractStore.box!.getUnopenedBoxes(maybeStore.value!.userWalletAddress);
    }
}

export const genesisUserStore = reactive(perUserProxyFactory(GenesisUserStore));
(async () => {
    const walletStore = await walletInitComplete;
    genesisUserStore._initialise(walletStore);
})();


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
        get: (target, prop: string, receiver) => {
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
    constructor(saledata: any) {
        for (const key in saledata)
            this[key] = saledata[key];
    }

    durationLeft() {
        return this.sale_start + this.sale_duration - Date.now() / 1000;
    }

    isLive() {
        return this.sale_start < Date.now() / 1000.0 && this.durationLeft() > 0;
    }
}


let initialCall = () => {
    const useStore = defineStore('genesis_data', {
        state: () => {
            return {
                network: { dev: 'mock', test: 'starknet-testnet', prod: 'starknet' }[APP_ENV],
                _metadata: {} as { [box_uid: string]: Fetchable<Record<string, any>> },
                _saledata: {} as { [box_uid: string]: Fetchable<SaleData> },
                _boxes: {} as { [theme_uid: string]: Fetchable<string[]> },
                _themedata: {} as { [theme_uid: string]: Fetchable<Record<string, any>> },
            }
        },
        getters: {
            metadata(state) {
                return autoFetchable(state._metadata as any, (prop) => backendManager.fetch(`v1/box/data/${state.network}/${prop}.json`));
            },
            themedata(state) {
                return autoFetchable(state._themedata as any, (theme_id) => backendManager.fetch(`v1/${state.network}/${theme_id}/data`));
            },
            boxes(state) {
                return autoFetchable(state._boxes as any, (theme_id) => backendManager.fetch(`v1/${state.network}/${theme_id}/boxes`));
            },
            saledata(state) {
                return autoFetchable(state._saledata as any, async (prop) => new SaleData(await backendManager.fetch(`v1/${state.network}/${prop}/saledata`)));
            },
            coverItemRoute() {
                return (token_id: string) => computed(() => {
                    return backendManager.getRoute(`box/cover_item/${this.network}/${token_id}.png`)
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
