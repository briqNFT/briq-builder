import { markRaw, shallowRef } from 'vue';
import { getCurrentNetwork } from '@/chain/Network';
import { backendManager } from '@/Backend';
import { noParallel } from '@/Async';

export type bookletId = string;

export interface BookletData {
    token_id: string,
    name: string,
    nb_pages: number,
    steps_progress: number[],
    description: string,
    briqs: { data: { material: string, color: string }, pos: [number, number, number] }[];
}

const bookletsData = {} as { [booklet_id: bookletId]: BookletData };

const loadBookletData = noParallel(async (booklet: bookletId) => {
    if (!booklet)
        return;
    if (bookletsData[booklet])
        return bookletsData[booklet];
    try {
        const metadata = await backendManager.fetch(`v1/booklet/data/${getCurrentNetwork()}/${booklet}.json`)
        bookletsData[booklet] = markRaw(metadata);
        return bookletsData[booklet];
    } catch(_) { /* ignore */ }
});

export async function getBookletData(bookletId: bookletId) {
    const ret = shallowRef(bookletsData?.[bookletId]);
    if (!ret.value)
        await loadBookletData(bookletId).then(x => ret.value = x);
    return ret;
}

export function getBookletDataSync(bookletId: bookletId) {
    const ret = shallowRef(bookletsData?.[bookletId]);
    if (!ret.value)
        loadBookletData(bookletId).then(x => ret.value = x);
    return ret;
}

export function getStepImgSrc(booklet: bookletId, page: number) {
    return `${backendManager.url}/v1/box/step_image/${getCurrentNetwork()}/${booklet}/${page - 1}.png`;
}

