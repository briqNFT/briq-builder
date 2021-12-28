import BriqContract from './contracts/briq'
import SetContract from './contracts/set'
import MintContract from './contracts/mint'

const ADDRESSES = {
    // Alpha4-goerli
    "https://alpha4.starknet.io": {
        briq: "0x01d6b126e22d2f805a64fa0ce53ddebcd37363d13ab89960bd2bf896dd2742d4",
        mint: "0x03dbda16e85ad0d72cd54ffd2971b4e18e71a4f9d1d310cc8fd2deb564fc8a59",
        set: "0x01618ffcb9f43bfd894eb4a176ce265323372bb4d833a77e20363180efca3a65",
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