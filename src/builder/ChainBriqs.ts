import { Briq, BriqsDB } from "./BriqsDB";
import type IBriqContract from '../contracts/briq';
import { reactive, watchEffect } from "vue";
import type { Ref } from "vue";
import { ticketing, isOutdated } from "../Async";
import { pushMessage } from "../Messages";
import { reportError } from "../Monitoring";

/**
 * Responsible for maintaining the state of 'on-chain' briqs, as opposed to local set-briqs.
 */
class ChainBriqs
{
    fetchingBriqs = false;
    DB = new BriqsDB();

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

    getTokens = ticketing(async function (this: ChainBriqs) {
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
            let bricks = await this.getTokens();
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
        for (let i = 0; i < jsonResponse.length / 3; ++i)
        {
            let briq = new Briq(jsonResponse[i*3 + 0], parseInt(jsonResponse[i*3 + 1], 16), jsonResponse[i*3 + 2]);
            briq.onChain = true;
            this.DB.briqs.set(briq.id, briq);
        }
    }
}

export function createChainBriqs()
{
    return reactive(new ChainBriqs()).watch();
}