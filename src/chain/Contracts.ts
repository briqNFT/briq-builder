import BriqContract from './contracts/briq';
import SetContract from './contracts/set';
import MintContract from './contracts/mint';

export const ADDRESSES = {
    mock: {
        briq: '0xA',
        set: '0xB',
        mint: '0xC',
        box: '0xD',
    },
    localhost: {
        briq: '0x05877d55d7a7ae8f65d6b3d059cfa68557b2a2fcd84ba04a9dcc46a55edf161a',
        set: '0x0706e8ffb66f5485d02e3c064975fd58f8c3e7367b92d0f509055c4cce288f7b',
        mint: '0x0549b84101aacd11fa4cfba50dcc2b2d4a6af46fe06cd4d60e3cbf7bb3ac3c4c',
    },
    'starknet-testnet': {
        briq: '0x01531b29c83b9a22adc1a4d1e148bec286227e81e13c14c0ec150ac86aef446f',
        set: '0x04591e35e7a0c6273267a9e5b6355c3d57a3f7a01a31b14f3fa6636746e8d9ed',
        box: '0x04591e35e7a0c6273267a9e5b6355c3d57a3f7a01a31b14f3fa6636746e8d9ed',
    },
    'starknet-testnet-legacy': {
        briq: '0x01317354276941f7f799574c73fd8fe53fa3f251084b4c04d88cf601b6bd915e',
        set: '0x0266b1276d23ffb53d99da3f01be7e29fa024dd33cd7f7b1eb7a46c67891c9d0',
        mint: '0x0578fd3377d865b7798140731b53258b1270ac19c37a3916645f80e0e4c8ad69',
        multicall: '0x047d851c70b1447ee8b9e54b3c4ce619a4a8bf56ea5a6fd6a19b21e98f360b73',
    },
    'starknet-mainnet': {
        briq: '',
        mint: '',
        set: '',
    },
};

const IMPL = {
    'mock': {
        briq: BriqContract,
        set: SetContract,
        mint: MintContract,
        box: BoxContract,
    },
    'localhost': {
        briq: BriqContract,
        set: SetContract,
        mint: MintContract,
    },
    'starknet-testnet': {
        briq: BriqContract,
        set: SetContract,
        box: BoxContract,
        multicall: MulticallContract,
    },
    'starknet-testnet-legacy': {
        briq: BriqContract,
        set: SetContract,
        mint: MintContract,
        multicall: MulticallContract,
    },
    'starknet-mainnet': {
        briq: BriqContract,
        mint: MintContract,
        set: SetContract,
    },
};

import { reactive, watchEffect, toRef, ref } from 'vue';
import { logDebug } from '../Messages';
import { CHAIN_NETWORKS, getCurrentNetwork } from './Network';
import { getProvider } from './Provider';
import MulticallContract from './contracts/Multicall';
import BoxContract from './contracts/box';

const contractStore = reactive({
    briq: undefined as undefined | BriqContract,
    mint: undefined as undefined | MintContract,
    set: undefined as undefined | SetContract,
    box: undefined as undefined | BoxContract,
    multicall: undefined as any,
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
            if (contr in addr) {
                console.log(signer.value, provider);
                contractStore[contr] = new impl[contr](addr[contr], signer.value ? signer.value : provider);
            } else
                contractStore[contr] = undefined;
    });
}
