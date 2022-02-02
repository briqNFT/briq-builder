import BriqContract from './contracts/briq'
import SetContract, { LegacySetContract }from './contracts/set'
import MintContract from './contracts/mint'

const ADDRESSES = {
    "localhost": {
        briq: "0x0514cf1db1f4e04f72db048dcad28226ebf6ad437619c49614bafaa140be733e",
        set: "0x058d6c220944d72f66eaff61e21dadd40dfd8ef04cea49b47f0b6fb11692371c",
        mint: "0x05bf33f741986346c4013551c388c5630d0da6953348654d0d48e04d8628960b",
    },
    "starknet-testnet": {
        briq: "0x04c3dc11b871736d8ec247f093303ab0be50adbe577bb7ca21b42b763bcb529e",
        set: "0x00e28377151a81d5333d794dd019798ed673bbd9be7c2c6544c0bf5536a7f7b3",
        mint: "0x03f22d16de350e92d2f4ee40f5dce3ca91bde5218d538424d640ad12fe71e01e",
    },
    "starknet-testnet-legacy": {
        set: "0x01618ffcb9f43bfd894eb4a176ce265323372bb4d833a77e20363180efca3a65",
        briq: "",
        mint: "",
    },
    "starknet-mainnet": {
        briq: "0x03c5c2e0c3e6f48c5fa286876418450304ae5da85d333bcbf35ca495d10939c5",
        mint: "0x05be37356fffd6bc49940dff73bfb92d2f355f2c3e9cddef36274b844c59dfc6",
        set: "0x03527d1810201e32d34bd2221713a9094b965c7af0be61e622714f27a937e547",
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
import { logDebug } from './Messages'
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
            contractStore.briq = new impl.briq(addr.briq, signer.value ? signer : provider);
            contractStore.set = new impl.set(addr.set, signer.value ? signer : provider);
            contractStore.mint = new impl.mint(addr.mint, signer.value ? signer : provider);
        }
        else
        {
            contractStore.briq = undefined;
            contractStore.set = undefined;
            contractStore.mint = undefined;
        }
    });    
}