// The purpose of this class is to cache set data that we don't particularly cache elsewhere.
// This includes sets for auctions & just sets that have been shared with the user.

import { backendManager } from '@/Backend';
import { Fetchable } from '@/DataFetching';
import { defaultDict } from '@/ReactiveDefaultDict';
import { reactive } from 'vue';
import { SetData } from './SetData';

export const externalSetCache = defaultDict((network: string) => defaultDict((setId: string) => {
    const setF = reactive(new Fetchable<SetData>());
    setF.fetch(async () => {
        const data = await backendManager.fetch(`v1/metadata/${network}/${setId}.json`);
        const set = new SetData(setId).deserialize(data);
        // Hack some data that we don't really support in there.
        if (data.background_color)
            set.background_color = data.background_color;
        set.booklet_id = data.booklet_id;
        set.created_at = data.created_at * 1000; // JS timestamps are milliseconds-based.
        return set;
    });
    return setF;
}),
);