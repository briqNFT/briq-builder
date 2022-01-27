import BriqContract from './contracts/briq'
import SetContract from './contracts/set'
import MintContract from './contracts/mint'

const ADDRESSES = {
    // Alpha4-goerli
    "https://alpha4.starknet.io": {
        briq: "0x043cbf41a2bc5c249122ec4492b6ebeb3c0af0fa1731cd56d13b63eb600388e9",
        set: "0x0003024212d1e2acd080e4c3b52e8c8b4960ee2b2ade314aeda8c041d50ffdd4",
        mint: "0x02ed98a4c7d6a0c6234fc7c846f425ab155c782e17eb584d2d71c1c25aea63c3",
    },
    "https://alpha-mainnet.starknet.io": {
        briq: "0x03c5c2e0c3e6f48c5fa286876418450304ae5da85d333bcbf35ca495d10939c5",
        mint: "0x05be37356fffd6bc49940dff73bfb92d2f355f2c3e9cddef36274b844c59dfc6",
        set: "0x03527d1810201e32d34bd2221713a9094b965c7af0be61e622714f27a937e547",
    }
}

const IMPL = {
    "https://alpha4.starknet.io": {
        briq: BriqContract,
        mint: MintContract,
        set: SetContract,
    },
    "https://alpha-mainnet.starknet.io": {
        briq: BriqContract,
        mint: MintContract,
        set: SetContract,
    }
}

import { reactive, watchEffect, toRef } from 'vue';
const contractStore = reactive({
    briq: undefined as undefined | BriqContract,
    mint: undefined as undefined | MintContract,
    set: undefined as undefined | SetContract,
});
export default contractStore;

/**
 * Called from the wallet store initialization method.
 */
export function watchSignerChanges(walletStore: any)
{
    let signer = toRef(walletStore, "signer");
    let provider = toRef(walletStore, "provider");

    watchEffect(async () => {
        let addr = walletStore.baseUrl && ADDRESSES?.[walletStore.baseUrl];
        let impl = walletStore.baseUrl && IMPL?.[walletStore.baseUrl];
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