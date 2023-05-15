import { watchEffect, toRef, ref } from 'vue';
import { logDebug } from '../Messages';
import { CHAIN_NETWORKS, getCurrentNetwork } from './Network';
import { getProvider } from './Provider';

import contractStore, { ADDRESSES } from './Contracts';

import BriqContract from './contracts/briq';
import SetContract from './contracts/set';
import AuctionContract from './contracts/auction';
import ERC20Contract from './contracts/erc20';
import BoxContract from './contracts/box';
import OnchainAuctionContract from './contracts/auction_onchain';
import BriqFactoryContract from './contracts/briq_factory';


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
        auction_ducks: OnchainAuctionContract,
        eth_bridge_contract: ERC20Contract,
        briq_factory: BriqFactoryContract,
    },
    'starknet-testnet2': {
        briq: BriqContract,
        set: SetContract,
        box: BoxContract,
        auction: AuctionContract,
        eth_bridge_contract: ERC20Contract,
    },
    'starknet-mainnet': {
        briq: BriqContract,
        set: SetContract,
        box: BoxContract,
        auction: AuctionContract,
        auction_ducks: OnchainAuctionContract,
        eth_bridge_contract: ERC20Contract,
    },
};

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
        logDebug('SWITCHING TO NETWORK ', network);
        for (const contr in impl)
            if (!contractStore[contr])
                contractStore[contr] = new impl[contr](addr[contr], signer.value ? signer.value : provider);
            else
                contractStore[contr].connect(addr[contr] || '0xdead', signer.value ? signer.value : provider);
    });
}
