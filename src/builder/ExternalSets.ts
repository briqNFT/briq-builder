// The purpose of this class is to cache set data that we don't particularly cache elsewhere.
// This includes sets for auctions & just sets that have been shared with the user.

import { backendManager } from '@/Backend';
import { Fetchable } from '@/DataFetching';
import { defaultDict } from '@/ReactiveDefaultDict';
import { reactive } from 'vue';
import { SetData } from './SetData';

// Shared format between UserSets and ExternalSets
export interface ExternalSetData {
    data: SetData,
    created_at: number,

    booklet_id?: string,
    properties?: Record<string, any>,
    background_color?: string,
    disassembled?: boolean,
}


export const externalSetCache = defaultDict((network: string) => defaultDict((setId: string) => {
    const setF = reactive(new Fetchable<ExternalSetData>());
    setF.fetch(async () => {
        const data = await backendManager.fetch(`v1/metadata/${network}/${setId}.json`);
        const set = new SetData(setId).deserialize(data);
        return  {
            data: set,
            created_at: data.created_at * 1000, // JS timestamps are milliseconds-based.
            properties: data.properties,
            booklet_id: data.booklet_id,
            background_color: data?.background_color,
            disassembled: data?.disassembled || false,
        }
    });
    return setF;
}),
);