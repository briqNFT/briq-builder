// The purpose of this class is to cache set data that we don't particularly cache elsewhere.
// This includes sets for auctions & just sets that have been shared with the user.
// TODO: bring the logic from SetPage here too, this only included the auctions (laziness).

import { backendManager } from '@/Backend';
import { Fetchable } from '@/DataFetching';
import { defaultDict } from '@/ReactiveDefaultDict';
import { SetData } from './SetData';

export const externalSetCache = defaultDict((network: string) => defaultDict((setId: string) => {
    const setF = new Fetchable<SetData>();
    setF.fetch(async () => {
        const data = await backendManager.fetch(`v1/metadata/${network}/${setId}.json`);
        return new SetData(setId).deserialize(data);
    });
    return setF;
}),
);