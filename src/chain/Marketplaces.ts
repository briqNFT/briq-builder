import { ADDRESSES } from '@/chain/Contracts';
import type { CHAIN_NETWORKS } from '@/chain/Network';
import { getSetAddress, getBookletAddress, getBoxAddress } from '@/chain/Collections';

export function getSetLink(marketplace: string, network: CHAIN_NETWORKS, collection: string, setId: string) {
    // TODO: handle networks properly
    if (marketplace === 'unframed')
        return `https://unframed.co/item/${getSetAddress(ADDRESSES[network], collection)}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'element') // They need 64-item long hex string
        return `https://element.market/assets/starknet/0x${getSetAddress(ADDRESSES[network], collection).slice(2).padStart(64, '0')}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'flex') // They need 64-item long hex string
        return `https://flexing.gg/starknet/asset/0x${getSetAddress(ADDRESSES[network], collection).slice(2).padStart(64, '0')}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'pyramid') // they don't support leading 0
        return `https://pyramid.market/asset/0x${BigInt(getSetAddress(ADDRESSES[network], collection)).toString(16)}/${BigInt(setId).toString(10)}`;
}

export function getBookletLink(marketplace: string, network: CHAIN_NETWORKS, collection: string, setId: string) {
    // TODO: handle networks properly
    if (marketplace === 'unframed')
        return `https://unframed.co/item/${getBookletAddress(ADDRESSES[network], collection)}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'element') // They need 64-item long hex string
        return `https://element.market/assets/starknet/0x${getBookletAddress(ADDRESSES[network], collection).slice(2).padStart(64, '0')}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'flex') // They need 64-item long hex string
        return `https://flexing.gg/starknet/asset/0x${getBookletAddress(ADDRESSES[network], collection).slice(2).padStart(64, '0')}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'pyramid') // they don't support leading 0
        return `https://pyramid.market/asset/0x${BigInt(getBookletAddress(ADDRESSES[network], collection)).toString(16)}/${BigInt(setId).toString(10)}`;
}

export function getBoxLink(marketplace: string, network: CHAIN_NETWORKS, collection: string, setId: string) {
    // TODO: handle networks properly
    if (marketplace === 'unframed')
        return `https://unframed.co/item/${getBoxAddress(ADDRESSES[network], collection)}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'element') // They need 64-item long hex string
        return `https://element.market/assets/starknet/0x${getBoxAddress(ADDRESSES[network], collection).slice(2).padStart(64, '0')}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'flex') // They need 64-item long hex string
        return `https://flexing.gg/starknet/asset/0x${getBoxAddress(ADDRESSES[network], collection).slice(2).padStart(64, '0')}/${BigInt(setId).toString(10)}`;
    if (marketplace === 'pyramid') // they don't support leading 0
        return `https://pyramid.market/asset/0x${BigInt(getBoxAddress(ADDRESSES[network], collection)).toString(16)}/${BigInt(setId).toString(10)}`;
}

export function getSetMarketplaceUrl() {
    return 'https://unframed.co/collection/0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672';
}

export function getBriqLink(marketplace: string, network: CHAIN_NETWORKS) {
    return 'https://element.market/collections/briq-token';
}
