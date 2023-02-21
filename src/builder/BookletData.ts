import { computed, isReactive, markRaw, reactive, shallowReactive } from 'vue';
import { getCurrentNetwork } from '@/chain/Network';
import { backendManager } from '@/Backend';
import { autoFetchable, makeAutoFetchable } from '@/DataFetching';

export type bookletId = string;

export interface BookletData {
    token_id: string,
    serial_number: number,
    name: string,
    nb_pages: number,
    steps_progress: number[],
    description: string,
    briqs: { data: { material: string, color: string }, pos: [number, number, number] }[];
    properties: Record<string, any>;
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
// which is assumed to be static (and thus marked raw).
const perNetworkStaticData = <T extends object>(query: (network: string, prop: string) => Promise<T>) => {
    return defaultDict((network: string) => makeAutoFetchable(async (prop: string) => {
        return markRaw(await query(network, prop));
    }));
}

export const bookletDataStore = perNetworkStaticData(async (network: string, booklet: bookletId): Promise<BookletData> => {
    return backendManager.fetch(`v1/booklet/data/${network}/${booklet}.json`);
});

export function getStepImgSrc(booklet: bookletId, page: number) {
    return `${backendManager.url}/v1/box/step_image/${getCurrentNetwork()}/${booklet}/${page - 1}.png`;
}

