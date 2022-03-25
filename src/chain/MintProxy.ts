import { reactive } from 'vue'
import type MintContract from './contracts/mint';
import { CONF } from '@/Conf';

import { ticketing, OutdatedPromiseError } from '../Async';

export const mintProxyStore = reactive({
    hasMinted: false,
    canMint: false,
    walletOk: true,
});

var getData = ticketing(async function(contract: MintContract, address: string) {
    let contractOk = contract.contract.providerOrAccount.getCode(address);
    let minted = contract.has_minted(address);
    return {
        contractOk: ((await contractOk)?.bytecode?.length ?? 0) > 0,
        minted: await minted
    };
})

export async function setupMintProxy(contract: MintContract, address: string)
{
    if (CONF.theme === "realms")
        return;
    mintProxyStore.hasMinted = false;
    mintProxyStore.canMint = false;
    mintProxyStore.walletOk = true;
    let res = {
        contractOk: false,
        minted: false,
    };
    try {
        res = await getData(contract, address);
    }
    catch(err)
    {
        console.error(err);
        if (err instanceof OutdatedPromiseError)
            return;
        res.contractOk = false;
        res.minted = false;
    }
    mintProxyStore.walletOk = res.contractOk;
    if (res.minted)
        mintProxyStore.hasMinted = true;
    else
        mintProxyStore.canMint = true;
}
