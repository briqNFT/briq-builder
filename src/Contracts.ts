import BriqContract, { ProdBriqContract } from './contracts/briq'
import SetContract, { ProdSetContract } from './contracts/set'
import MintContract from './contracts/mint'

const ADDRESSES = {
    // Alpha4-goerli
    "https://alpha4.starknet.io": {
        briq: "0x066c0a6dbfa8c1e2a9d41658d03ec22f20e751f0b81c189d451cade12cf2cef9",
        mint: "0x036b6a131a44e2b60684529c7dbd4f857371b0279e6d309e2bf094f5a976ddfa",
        set: "0x05958f8b2214242bd436faac06e0db6b953c03348ce960aab9f4f4bcecb23014",
        briq_erc20: "0x0373419e9c39a1f5e1995382c7bd89e00dea6cd02f8bb26e8d7e1df071aac775",
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
    briq_erc20: undefined as undefined | object,
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
            contractStore.briq_erc20 = { connectedTo: addr.briq_erc20 };
        }
        else
        {
            contractStore.briq = undefined;
            contractStore.set = undefined;
            contractStore.mint = undefined;
            contractStore.briq_erc20 = undefined;
        }
    });    
}