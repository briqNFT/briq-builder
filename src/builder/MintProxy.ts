import {reactive } from 'vue'
import type MintContract from '../contracts/mint';

import * as starknet from "starknet";

export const mintProxyStore = reactive({
    hasMinted: false,
    canMint: false,
    walletOk: true,
});

export async function setupMintProxy(contract: MintContract, address: string)
{
    let contractOk = contract.provider.getCode(address);
    let minted = contract.has_minted(address);
    let res = {
        contractOk: false,
        minted: false,
    };
    try {
        res = {
            contractOk: ((await contractOk)?.bytecode?.length ?? 0) > 0,
            minted: await minted
        };
    }
    catch(err)
    {
        res.contractOk = false;
        res.minted = false;
    }
    mintProxyStore.walletOk = res.contractOk;
    if (res.minted)
        mintProxyStore.hasMinted = true;
    else
        mintProxyStore.canMint = true;
}
