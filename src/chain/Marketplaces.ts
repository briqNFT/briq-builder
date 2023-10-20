import { ADDRESSES } from '@/chain/Contracts';
import type { CHAIN_NETWORKS } from '@/chain/Network';

export function getSetLink(marketplace: string, network: CHAIN_NETWORKS, setId: string) {
    // TODO: handle networks properly
    // TODO: handle different set contracts
    if (marketplace === 'unframed')
        return `https://unframed.co/item/${ADDRESSES[network].set}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'element')
        return `https://element.market/assets/starknet/${ADDRESSES[network].set}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'flex')
        return `https://flexing.gg/starknet/asset/${ADDRESSES[network].set}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'pyramid') // they don't support leading 0
        return `https://pyramid.market/asset/0x${BigInt(ADDRESSES[network].set).toString(16)}/${BigInt(setId).toString(10)}`;
}

export function getBookletLink(marketplace: string, network: CHAIN_NETWORKS, setId: string) {
    // TODO: handle networks properly
    // TODO: handle different set contracts
    if (marketplace === 'unframed')
        return `https://unframed.co/item/${ADDRESSES[network].booklet}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'element')
        return `https://element.market/assets/starknet/${ADDRESSES[network].booklet}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'flex')
        return `https://flexing.gg/starknet/asset/${ADDRESSES[network].booklet}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'pyramid') // they don't support leading 0
        return `https://pyramid.market/asset/0x${BigInt(ADDRESSES[network].booklet).toString(16)}/${BigInt(setId).toString(10)}`;
}

export function getBoxLink(marketplace: string, network: CHAIN_NETWORKS, setId: string) {
    // TODO: handle networks properly
    // TODO: handle different set contracts
    if (marketplace === 'unframed')
        return `https://unframed.co/item/${ADDRESSES[network].box}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'element')
        return `https://element.market/assets/starknet/${ADDRESSES[network].box}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'flex')
        return `https://flexing.gg/starknet/asset/${ADDRESSES[network].box}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'pyramid') // they don't support leading 0
        return `https://pyramid.market/asset/0x${BigInt(ADDRESSES[network].box).toString(16)}/${BigInt(setId).toString(10)}`;
}

export function getSetMarketplaceUrl() {
    return 'https://unframed.co/collection/0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672';
}
