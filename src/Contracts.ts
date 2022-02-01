import BriqContract from './contracts/briq'
import SetContract from './contracts/set'
import MintContract from './contracts/mint'

const ADDRESSES = {
    // Alpha4-goerli
    "https://alpha4.starknet.io": {
        briq: "0x04c3dc11b871736d8ec247f093303ab0be50adbe577bb7ca21b42b763bcb529e",
        set: "0x00e28377151a81d5333d794dd019798ed673bbd9be7c2c6544c0bf5536a7f7b3",
        mint: "0x03f22d16de350e92d2f4ee40f5dce3ca91bde5218d538424d640ad12fe71e01e",
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