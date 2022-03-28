import BriqContract from './contracts/briq'
import SetContract, { LegacySetContract }from './contracts/set'
import MintContract from './contracts/mint'

export const ADDRESSES = {
    "localhost": {
        briq: "0x05877d55d7a7ae8f65d6b3d059cfa68557b2a2fcd84ba04a9dcc46a55edf161a",
        set: "0x0706e8ffb66f5485d02e3c064975fd58f8c3e7367b92d0f509055c4cce288f7b",
        mint: "0x0549b84101aacd11fa4cfba50dcc2b2d4a6af46fe06cd4d60e3cbf7bb3ac3c4c",
    },
    "starknet-testnet": {
        briq: "0x01317354276941f7f799574c73fd8fe53fa3f251084b4c04d88cf601b6bd915e",
        set: "0x0266b1276d23ffb53d99da3f01be7e29fa024dd33cd7f7b1eb7a46c67891c9d0",
        mint: "0x0578fd3377d865b7798140731b53258b1270ac19c37a3916645f80e0e4c8ad69",
    },
    "starknet-testnet-legacy": {
        set: "0x01618ffcb9f43bfd894eb4a176ce265323372bb4d833a77e20363180efca3a65",
        briq: "",
        mint: "",
    },
    "starknet-mainnet": {
        briq: "",
        mint: "",
        set: "",
    }
}

const IMPL = {
    "localhost": {
        briq: BriqContract,
        set: SetContract,
        mint: MintContract,
    },
    "starknet-testnet": {
        briq: BriqContract,
        set: SetContract,
        mint: MintContract,
    },
    "starknet-testnet-legacy": {
        set: LegacySetContract,
        briq: BriqContract,
        mint: MintContract,
    },
    "starknet-mainnet": {
        briq: BriqContract,
        mint: MintContract,
        set: SetContract,
    }
}

import { reactive, watchEffect, toRef, ref } from 'vue';
import { logDebug } from '../Messages'
const contractStore = reactive({
    briq: undefined as undefined | BriqContract,
    mint: undefined as undefined | MintContract,
    set: undefined as undefined | SetContract,
});

export default contractStore;

var selectedNetwork = ref("");

const NETWORK_MAPPING = {
    "http://localhost:5000": "localhost",
    "https://alpha4.starknet.io": "starknet-testnet",
    "https://alpha-mainnet.starknet.io": "starknet-mainnet",
} as { [baseUrl: string]: string };

export function forceNetwork(network: string = "")
{
    selectedNetwork.value = network;
}

/**
 * Called from the wallet store initialization method.
 */
export function watchSignerChanges(walletStore: any)
{
    let signer = toRef(walletStore, "signer");
    let provider = toRef(walletStore, "provider");

    watchEffect(async () => {
        let network = selectedNetwork?.value || NETWORK_MAPPING[walletStore.baseUrl];
        let addr = walletStore.baseUrl && ADDRESSES?.[network];
        let impl = walletStore.baseUrl && IMPL?.[network];
        logDebug("SWITCHING TO NETWORK", network, walletStore.baseUrl);
        if (addr)
        {
            contractStore.briq = new impl.briq(addr.briq, signer.value ? signer.value : provider.value);
            contractStore.set = new impl.set(addr.set, signer.value ? signer.value : provider.value);
            contractStore.mint = new impl.mint(addr.mint, signer.value ? signer.value : provider.value);
        }
        else
        {
            contractStore.briq = undefined;
            contractStore.set = undefined;
            contractStore.mint = undefined;
        }
    });    
}