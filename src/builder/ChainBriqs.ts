import { Briq } from './Briq';
import type IBriqContract from '../chain/contracts/briq';
import { reactive, watchEffect } from "vue";
import type { Ref } from "vue";
import { ticketing, isOutdated } from "../Async";
import { logDebug, pushMessage } from "../Messages";
import { reportError } from "../Monitoring";
import { number } from 'starknet';

// TODO: there can technically be more than whatever is supported by number
type BALANCE = { ft_balance: number, nft_ids: string[] };

export const MATERIAL_GENESIS = "0x1"

class NotEnoughBriqs extends Error
{
    material: string;
    constructor(material: string)
    {
        super(`Not enough Briqs with material ${material}`);
        this.material = material;
    }
}

class NFTNotAvailable extends Error
{
    token_id: string;
    constructor(token_id: string)
    {
        super(`The NFT ${token_id} is not available, the set cannot be minted.`);
        this.token_id = token_id;
    }
}

/**
 * Responsible for maintaining the state of 'on-chain' briqs, as opposed to local set-briqs.
 */
export class ChainBriqs
{
    fetchingBriqs = false;

    byMaterial: { [material: string]: BALANCE } = {};

    briqContract: undefined | IBriqContract;
    addr: undefined | string;

    fastBalance: number = 0;

    status = 'NOT_LOADED' as 'NOT_LOADED' | 'OK' | 'ERROR';

    reset() {
        this.status = 'NOT_LOADED';
        this.fastBalance = 0;
        this.byMaterial = {};
    }

    watch() {
        watchEffect(() => { this.loadFromChain(); this.updateFastBalance(); } );
        return this;
    }

    setContract(contract?: IBriqContract)
    {
        this.briqContract = contract;
        logDebug("CHAIN BRIQS - CONTRACT IS ", contract);
    }

    setAddress(addr: Ref<string>)
    {
        // Because we are reactive, this will get unwrapped silently. Typescript complains.
        this.addr = addr as unknown as string;
        logDebug("CHAIN BRIQS - ADDRESS IS ", addr, addr.value);
    }

    _getTokens = ticketing(async function (this: ChainBriqs) {
        return await this.briqContract!.balanceDetailsOf(this.addr!, MATERIAL_GENESIS)
    });

    async loadFromChain()
    {
        this.fetchingBriqs = true;
        if (!this.briqContract || !this.addr)
        {
            this.reset();
            return;
        }
        logDebug("CHAIN BRIQS - LOADING ", this.briqContract?.address, this.addr);
        try {
            let balance = await this._getTokens();
            this.parseChainData(balance);
            this.status = 'OK';
            logDebug("CHAIN BRIQS - LOADED ", balance);
        }
        catch(err)
        {
            if (isOutdated(err))
                return;
            if (err?.message === "Network Error")
                pushMessage("Error fetching briqs - the connection to starknet timed out");
            else
            {
                pushMessage("Error fetching briqs - see console for details");
                reportError(err as Error);
            }
            console.error(err);
            this.status = 'ERROR';
        }
        this.fetchingBriqs = false;
    }

    parseChainData(balanceJSON: { ft_balance: string, nft_ids: string[] })
    {
        this.byMaterial = {};
        this.byMaterial[MATERIAL_GENESIS] = { ft_balance: balanceJSON.ft_balance, nft_ids: balanceJSON.nft_ids };
    }

    _getBalance = ticketing(async function (this: ChainBriqs) {
        return await this.briqContract!.balanceOf(this.addr!, MATERIAL_GENESIS)
    });

    async updateFastBalance()
    {
        if (!this.briqContract || !this.addr)
        {
            this.reset();
            return;
        }
        try {
            this.fastBalance = await this._getBalance();
        }
        catch(_){}
    }

    _getNbBriqs(material: string)
    {
        return this.byMaterial?.[material]?.ft_balance ?? 0 + this.byMaterial?.[material]?.nft_ids?.length ?? 0;
    }

    getNbBriqs()
    {
        let ret = 0;
        for (let material in this.byMaterial)
            ret += this._getNbBriqs(material);
        return ret;
    }

    getBalance()
    {
        return this.getNbBriqs() || this.fastBalance;
    }

    getBalanceDetails(): ({ material: string, qty: number } | { material: string, token_id: string })[]
    {
        let ret = [];
        for (let mat in this.byMaterial)
        {
            if (this.byMaterial[mat].ft_balance)
                ret.push({ material: mat, qty: this.byMaterial[mat].ft_balance });
            for (let token_id of this.byMaterial[mat].nft_ids)
                ret.push({ material: mat, token_id })
        }
        return ret;
    }

    /**
     * Check that we have enough on-chain briqs available,
     * and if not return NFTs that can be used to complement.
     * Note that this function won't swap existing NFTs that are unavailable.
     * @param usageByMaterial entry balance
     * @returns a list of NFT briqs to replace.
     */
    findRealBriqs(usageByMaterial: { [material: string]: { ft_balance: number, nft_ids: string[] } })
    {
        let swaps = [] as Briq[];
        for (let mat in usageByMaterial)
        {
            if (!this.byMaterial[mat])
                throw new NotEnoughBriqs(mat);
            let chainBalance = Object.assign({}, this.byMaterial[mat]);
            // Check that the NFTs we want to lay down are available.
            for (let nft of usageByMaterial[mat].nft_ids)
                if (chainBalance.nft_ids.indexOf(nft) === -1)
                    throw new NFTNotAvailable(nft);
            chainBalance.ft_balance -= usageByMaterial[mat].ft_balance;
            // At this point if we have enough fungible we're good.
            if (chainBalance.ft_balance >= 0)
                continue;
            // Otherwise we'll use leftover NFTs.
            let need = -chainBalance.ft_balance;
            if (need > chainBalance.nft_ids.length)
                throw new NotEnoughBriqs(mat);
            for (let i = 0; i < need; ++i)
                swaps.push(new Briq(mat).setNFTid(chainBalance.nft_ids.pop()!))
        }
        return swaps;
    }
}

export function createChainBriqs()
{
    return reactive(new ChainBriqs()).watch();
}
