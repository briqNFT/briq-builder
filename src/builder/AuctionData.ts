import { computed, isReactive, markRaw, reactive, shallowReactive } from 'vue';
import { getCurrentNetwork } from '@/chain/Network';
import { backendManager } from '@/Backend';
import { autoFetchable, makeAutoFetchable } from '@/DataFetching';

export type auctionId = string;

export interface AuctionItemData {
    minimum_bid: string,
    growth_factor: number,
    start_date: number,
    duration: number,
    highest_bid: string,
    highest_bidder: string
}

// Returns existing object or creates a new one and returns it.
const defaultDict = <T>(t: (prop: string) => T, ...args: any[]) => {
    return new Proxy(shallowReactive({} as Record<string, T>), {
        get: (target, prop: string, receiver): T => {
            if (Reflect.has(target, prop))
                return Reflect.get(target, prop, receiver);
            target[prop] = t(prop, ...args);
            return target[prop];
        },
        set: (target, prop, value) => {
            return Reflect.set(target, prop, value);
        },
    });
}

// Creates a simple object indexing on network ID & object key.
// The `query` data fetcher receives those as arguments and returns the data,
// which is assumed to be POD (and thus marked raw).
const perNetworkStaticData = (query: (network: string, prop: string) => Promise<any>) => {
    return defaultDict((network: string) => makeAutoFetchable(async (prop: string) => {
        return markRaw(await query(network, prop));
    }));
}

let generalQuery;
export const auctionDataStore = perNetworkStaticData(async (network: string, path: auctionId) => {
    if (!generalQuery)
        generalQuery = backendManager.fetch(`v1/${network}/${path.split('/')[0]}/auction_data`);
    return (await generalQuery)?.[path] ?? {
        token_id: '0xcafe',
        minimum_bid: '10000',
        growth_factor: 10,
        start_date: Date.now() / 1000,
        duration: 3600,
        highest_bid: '0',
        highest_bidder: '',
    };
});
