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
        briq: '0x040f7073063fd8949d79659930e64359da5c7782d92c2208ff7e2317b5d6f69f',
        set: '0x0475879f1c77ef0446716755f79690ad7a0a949f17115e1a089128300121e126',
        auction: '0x04b91ecb5908df3c4a669f6b4a2c56729cc56c99c2cde78ad29fc06f8e870625',
        eth_bridge_contract: '0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488',
    },
    'starknet-testnet': {
        briq: '0x01531b29c83b9a22adc1a4d1e148bec286227e81e13c14c0ec150ac86aef446f',
        set: '0x04591e35e7a0c6273267a9e5b6355c3d57a3f7a01a31b14f3fa6636746e8d9ed',
        box: '0x04591e35e7a0c6273267a9e5b6355c3d57a3f7a01a31b14f3fa6636746e8d9ed',
        eth_bridge_contract: '0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488',
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
        multicall: MulticallContract,
        eth_bridge_contract: ERC20Contract,
    },
    'starknet-mainnet': {
        briq: BriqContract,
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
    set: undefined as undefined | SetContract,
    box: undefined as undefined | BoxContract,
    multicall: undefined as any,
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
