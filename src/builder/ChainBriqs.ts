import { Briq, BriqsDB } from "./BriqsDB";
import type IBriqContract from '../contracts/briq';
import { reactive, watchEffect } from "vue";
import type { Ref } from "vue";
import { ticketing, isOutdated } from "../Async";
import { pushMessage } from "../Messages";
import { reportError } from "../Monitoring";

class NotEnoughBriqs extends Error
{
    token_id: string;
    constructor(token_id: string)
    {
        super(`Not enough Briqs with token_id ${token_id}`);
        this.token_id = token_id;
    }
}

/**
 * Responsible for maintaining the state of 'on-chain' briqs, as opposed to local set-briqs.
 */
class ChainBriqs
{
    fetchingBriqs = false;

    DB = new BriqsDB();
    byTokenId: { [token_id: string]: number} = {};

    briqContract: undefined | IBriqContract;
    addr: undefined | string;

    watch() {
        watchEffect(() => this.loadFromChain());
        return this;
    }

    setContract(contract?: IBriqContract)
    {
        this.briqContract = contract;
        console.log("CHAIN BRIQS - CONTRACT IS ", contract);
    }

    setAddress(addr: Ref<string>)
    {
        // Because we are reactive, this will get unwrapped silently. Typescript complains.
        this.addr = addr as unknown as string;
        console.log("CHAIN BRIQS - ADDRESS IS ", addr, addr.value);
    }

    _getTokens = ticketing(async function (this: ChainBriqs) {
        return await this.briqContract!.get_all_tokens_for_owner(this.addr!) as string[];
    });

    async loadFromChain()
    {
        this.fetchingBriqs = true;
        if (!this.briqContract || !this.addr)
        {
            // TODO: reset briqs.
            return;
        }
        console.log("CHAIN BRIQS - LOADING ", this.briqContract?.connectedTo, this.addr);
        try {
            let bricks = await this._getTokens();
            this.parseChainData(bricks);
            console.log("CHAIN BRIQS - LOADED ", bricks);
        }
        catch(err)
        {
            if (isOutdated(err))
                return;
            pushMessage("Error fetching briqs - see console for details");
            reportError(err as Error);
            console.error(err);
        }
        this.fetchingBriqs = false;
    }

    parseChainData(jsonResponse: string[])
    {
        this.byTokenId = {};
        for (let i = 0; i < jsonResponse.length / 3; ++i)
        {
            let briq = new Briq(jsonResponse[i*3 + 0], parseInt(jsonResponse[i*3 + 1], 16), jsonResponse[i*3 + 2]);
            briq.temp_id = briq.id;
            briq.id = "0x1";
            briq.onChain = true;
            this.DB.briqs.set(briq.temp_id, briq);
            if (briq.partOfSet())
                continue;
            if (!this.byTokenId[briq.id])
                this.byTokenId[briq.id] = 0;
            ++this.byTokenId[briq.id];
        }
    }

    getNbBriqs()
    {
        let ret = 0;
        for (let tid in this.byTokenId)
            ret += this.byTokenId[tid];
        return ret;
    }

    getBriqs(token_id: string, need: number)
    {
        if (this.byTokenId[token_id] < need)
            throw new NotEnoughBriqs(token_id);
        let ret = [];
        for (let i = 0; i < need; ++i)
        {
            let br = new Briq(token_id, 1, "")
            br.onChain = true;
            ret.push(br);
        }
        return ret;
    }
}

export type { ChainBriqs };

export function createChainBriqs()
{
    return reactive(new ChainBriqs()).watch();
}