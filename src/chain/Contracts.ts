import BriqContract from './contracts/briq';
import SetContract from './contracts/set';
import AuctionContract from './contracts/auction';
import ERC20Contract from './contracts/erc20';

export const ADDRESSES = {
    mock: {
        briq: '0xA',
        set: '0xB',
        box: '0xD',
    },
    localhost: {
        briq: '0x020b2a2baa5f0c679ba7647ed803e975bb6badfe9334b5944a547ac12ef4c099',
        set: '0x03ab0330cff177e3f154cc143b46e9ddac39041ba8ce201def9e3ca8e2aa921a',
        auction: '0x05dd2d089793684e837e01dc136503721f5915af46b8096a7363bb9dbd44901c',
        eth_bridge_contract: '0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488',
    },
    'starknet-testnet': {
        briq: '0x009c80aaf74330a0b56dddefc4e6bab33d03415e67a0092cc048b0d6fb2cc3dd',
        set: '0x032ded561a3c59d063bf16a1de833ac2826370ad1662baba548c08fa29eba850',
        box: '0x07f4c8f5d2e70955bf9b4275abb48781049839dc0a45a3f7d0761c61d61811cc',
        booklet: '0x048580b27b4cb0ac15069ba2bf9a8586cb072f65dbcd4659a220a747f57f89e6',
        auction: '0x04a97166c6718f85162f05270274ccede8e20e6aaa47a389f478d9df71ee6a95',
        eth_bridge_contract: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    },
    'starknet-mainnet': {
        briq: '',
        set: '',
    },
};

const IMPL = {
    'mock': {
        briq: BriqContract,
        set: SetContract,
        box: BoxContract,
    },
    'localhost': {
        briq: BriqContract,
        set: SetContract,
        auction: AuctionContract,
        eth_bridge_contract: ERC20Contract,
    },
    'starknet-testnet': {
        briq: BriqContract,
        set: SetContract,
        box: BoxContract,
        auction: AuctionContract,
        eth_bridge_contract: ERC20Contract,
    },
    'starknet-mainnet': {
        briq: BriqContract,
        set: SetContract,
    },
};

import { shallowReactive, watchEffect, toRef, ref } from 'vue';
import { logDebug } from '../Messages';
import { CHAIN_NETWORKS, getCurrentNetwork } from './Network';
import { getProvider } from './Provider';
import BoxContract from './contracts/box';

const contractStore = shallowReactive({
    briq: undefined as undefined | BriqContract,
    set: undefined as undefined | SetContract,
    box: undefined as undefined | BoxContract,
    auction: undefined as undefined | AuctionContract,
    eth_bridge_contract: undefined as undefined | ERC20Contract,
});

export default contractStore;

const selectedNetwork = ref('' as CHAIN_NETWORKS | undefined);
export function forceNetwork(network?: CHAIN_NETWORKS) {
    selectedNetwork.value = network;
}

/**
 * Called from the wallet store initialization method.
 */
export function watchSignerChanges(walletStore: any) {
    const signer = toRef(walletStore, 'signer');
    const provider = getProvider();

    watchEffect(async () => {
        const network = selectedNetwork.value || getCurrentNetwork();
        const addr = network && ADDRESSES?.[network];
        const impl = network && IMPL?.[network];
        logDebug('SWITCHING TO NETWORK', network);
        for (const contr in impl)
            if (contr in addr)
                contractStore[contr] = new impl[contr](addr[contr], signer.value ? signer.value : provider);
            else
                contractStore[contr] = undefined;
    });
}
