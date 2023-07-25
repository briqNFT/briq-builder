import { ADDRESSES } from '@/chain/Contracts';
import type { CHAIN_NETWORKS } from '@/chain/Network';
import { number as nb } from 'starknet';

export function getSetLink(network: CHAIN_NETWORKS, setId: string) {
    const token_decimal = nb.toBN(setId).toString();
    // Unframed is mainnet only for now.
    return `http://unframed.co/item/${ADDRESSES[network].set}/${token_decimal}`;
}

export function getSetMarketplaceUrl() {
    return 'https://unframed.co/collection/0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672';
}
