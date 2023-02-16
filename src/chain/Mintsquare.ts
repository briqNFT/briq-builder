import  { ADDRESSES } from '@/chain/Contracts';
import type { CHAIN_NETWORKS } from '@/chain/Network';
import { number as nb } from 'starknet';

export function getSetLink(network: CHAIN_NETWORKS, setId: string) {
    const token_decimal = nb.toBN(setId).toString();
    return `https://mintsquare.io/asset/${ network === 'starknet-mainnet' ? 'starknet' : 'starknet-testnet' }/${ADDRESSES[network].set}/${token_decimal}`;
}
