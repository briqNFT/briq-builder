import { reactive, markRaw, shallowRef } from 'vue';
import { getCurrentNetwork } from '@/chain/Network';
import { backendManager } from '@/Backend';
import { autoFetchable } from './GenesisStore';

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

const makeAutoFetchable = <keyT, valueT>(dataFetcher: (key: keyT) => Promise<valueT>) => {
    return autoFetchable(reactive({}), dataFetcher);
}

export const bookletDataStore = makeAutoFetchable(
    async (booklet: bookletId) => {
        if (!booklet)
            throw Error('No booklet passed');
        return markRaw(await backendManager.fetch(`v1/booklet/data/${getCurrentNetwork()}/${booklet}.json`));
    },
);

export function getStepImgSrc(booklet: bookletId, page: number) {
    return `${backendManager.url}/v1/box/step_image/${getCurrentNetwork()}/${booklet}/${page - 1}.png`;
}
