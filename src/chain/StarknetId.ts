import { Fetchable } from '@/DataFetching';
import { defaultDict } from '@/ReactiveDefaultDict';
import { CHAIN_NETWORKS } from './Network';
import { reactive } from 'vue';

export const addressToStarknetId = defaultDict((network: CHAIN_NETWORKS) =>
    defaultDict((address: string) => {
        const ret = reactive(new Fetchable<string>());
        ret.fetch(async () => {
            const response = await fetch('https://app.starknet.id/api/indexer/addr_to_domain?addr=' + BigInt(address).toString());
            const json = await response.json()
            if (json.domain)
                return json.domain;
            return false;
        });
        return ret;
    }),
);
