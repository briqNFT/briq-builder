import BriqContract, { ProdBriqContract } from './contracts/briq'
import SetContract, { ProdSetContract } from './contracts/set'
import MintContract, { ProdMintContract } from './contracts/mint'

const ADDRESSES = {
    // Alpha4-goerli
    "https://alpha4.starknet.io": {
        briq: "0x06ef7bdad787d1442aed56e8a8863f27a9b5a3dd278d0fb09a75b0aaba1d7512",
        mint: "0x05786cc6e77d1eb312e2e6fd1210697abb7e06ccfb48e82774ede15cc63e0f1a",
        set: "0x039dff96e31dc4413dce8e32751a718dcc876efee05e2adee2fc83efcad2c04c",
        briq_erc20: "0x05e29c9716ca704f0712e97073023a1e9014cfcf113b229d7e8dfe15cd5906fc",
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
        mint: ProdMintContract,
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