import BriqContract, { ProdBriqContract } from './contracts/briq'
import SetContract, { ProdSetContract } from './contracts/set'
import MintContract from './contracts/mint'

const ADDRESSES = {
    // Alpha4-goerli
    "https://alpha4.starknet.io": {
        briq: "0x011ddf2b37e4eecaa3a52b69e0c692cc2856a5a55c559aba1692019fb2c2030b",
        mint: "0x026faf2c0f470949b115e4273e54e1183ac4567b4da5bba27ac691cabfbec5ee",
        set: "0x036a2ffb6251cabfa89414da5ec7f939fcd7f3c5da1020b4e1e2867bc3ea82b8",
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
        briq: ProdBriqContract,
        mint: MintContract,
        set: ProdSetContract,
    }
}

import { reactive, watchEffect, toRef } from 'vue';
const contractStore = reactive({
    briq: undefined as undefined | BriqContract | ProdBriqContract,
    mint: undefined as undefined | MintContract,
    set: undefined as undefined | SetContract | ProdSetContract,
});
export default contractStore;

/**
 * Called from the wallet store initialization method.
 */
export function watchSignerChanges(walletStore: any)
{
    let signer = toRef(walletStore, "signer");

    watchEffect(async () => {
        let addr = walletStore.baseUrl && ADDRESSES?.[walletStore.baseUrl];
        let impl = walletStore.baseUrl && IMPL?.[walletStore.baseUrl];
        if (addr)
        {
            contractStore.briq = new impl.briq(addr.briq, signer);
            contractStore.set = new impl.set(addr.set, signer);
            contractStore.mint = new impl.mint(addr.mint, signer);
        }
        else
        {
            contractStore.briq = undefined;
            contractStore.set = undefined;
            contractStore.mint = undefined;
        }
    });    
}