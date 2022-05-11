import BriqContract from './contracts/briq';
import SetContract, { LegacySetContract } from './contracts/set';
import MintContract from './contracts/mint';

export const ADDRESSES = {
    mock: {
        briq: '0xA',
        set: '0xB',
        mint: '0xC',
    },
    localhost: {
        briq: '0x05877d55d7a7ae8f65d6b3d059cfa68557b2a2fcd84ba04a9dcc46a55edf161a',
        set: '0x0706e8ffb66f5485d02e3c064975fd58f8c3e7367b92d0f509055c4cce288f7b',
        mint: '0x0549b84101aacd11fa4cfba50dcc2b2d4a6af46fe06cd4d60e3cbf7bb3ac3c4c',
    },
    'starknet-testnet': {
        briq: '0x06ef66b0fa2e2256aee4e12eb981ac57cd6b5711fc3d90080c8dd6bb200dcae4',
        set: '0x02aac8d2beb9731cba2fced34fa8b5ac146aa35e87d90faad4326c8495cbfef9',
        multicall: '0x047d851c70b1447ee8b9e54b3c4ce619a4a8bf56ea5a6fd6a19b21e98f360b73',
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
    },
    'localhost': {
        briq: BriqContract,
        set: SetContract,
        mint: MintContract,
    },
    'starknet-testnet': {
        briq: BriqContract,
        set: SetContract,
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
const contractStore = reactive({
    briq: undefined as undefined | BriqContract,
    mint: undefined as undefined | MintContract,
    set: undefined as undefined | SetContract,
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
        if (addr && addr.briq) {
            contractStore.briq = new impl.briq(addr.briq, signer.value ? signer.value : provider);
            contractStore.set = new impl.set(addr.set, signer.value ? signer.value : provider);
            contractStore.mint = new impl.mint(addr.mint, signer.value ? signer.value : provider);
        } else {
            contractStore.briq = undefined;
            contractStore.set = undefined;
            contractStore.mint = undefined;
        }
    });
}
