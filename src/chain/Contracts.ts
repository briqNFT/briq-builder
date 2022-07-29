import BriqContract from './contracts/briq';
import SetContract from './contracts/set';
import MintContract from './contracts/mint';
import AuctionContract from './contracts/auction';

export const ADDRESSES = {
    mock: {
        briq: '0xA',
        set: '0xB',
        mint: '0xC',
        box: '0xD',
    },
    localhost: {
        briq: '0x040f7073063fd8949d79659930e64359da5c7782d92c2208ff7e2317b5d6f69f',
        set: '0x0475879f1c77ef0446716755f79690ad7a0a949f17115e1a089128300121e126',
        auction: '0x04b91ecb5908df3c4a669f6b4a2c56729cc56c99c2cde78ad29fc06f8e870625',
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
        auction: AuctionContract,
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
    auction: undefined as undefined | AuctionContract,
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
