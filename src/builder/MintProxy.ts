import { reactive } from 'vue'
import type MintContract from '../contracts/mint';

export const mintProxyStore = reactive({
    hasMinted: false,
    canMint: false,
});

export async function setupMintProxy(contract: MintContract, address: string)
{
    let minted = await contract.has_minted(address);
    console.log("minted for ", address, minted);
    if (minted)
        mintProxyStore.hasMinted = true;
    else
        mintProxyStore.canMint = true;
}
