import { Briq, BriqsDB } from "./BriqsDB";
import type IBriqContract from '../contracts/briq';
import { reactive, watchEffect } from "vue";
import type { Ref } from "vue";
import { ticketing, isOutdated } from "../Async";
import { pushMessage } from "../Messages";
import { reportError } from "../Monitoring";

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


/**
 * Responsible for maintaining the state of 'on-chain' briqs, as opposed to local set-briqs.
 */
export class ChainBriqs
{
    fetchingBriqs = false;

    DB = new BriqsDB();
    byMaterial: { [material: string]: BALANCE } = {};

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
        return await this.briqContract!.balanceDetailsOf(this.addr!, MATERIAL_GENESIS)
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
            let balance = await this._getTokens();
            this.parseChainData(balance);
            console.log("CHAIN BRIQS - LOADED ", balance);
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

    parseChainData(balanceJSON: { ft_balance: string, nft_ids: string[] })
    {
        this.byMaterial = {};
        this.byMaterial[MATERIAL_GENESIS] = { ft_balance: parseInt(balanceJSON.ft_balance, 16), nft_ids: balanceJSON.nft_ids };
    }

    _getNbBriqs(material: string)
    {
        return this.byMaterial[material].ft_balance + this.byMaterial[material].nft_ids.length;
    }

    getNbBriqs()
    {
        let ret = 0;
        for (let material in this.byMaterial)
            ret += this._getNbBriqs(material);
        return ret;
    }

    findRealBriqs(usageByMaterial: { [material: string]: { need: [number, number, number][], ft_balance: number, nft_ids: string[] } })
    {
        let swaps = [];
        for (let mat in usageByMaterial)
        {
            if (!usageByMaterial[mat].need.length)
                continue;
            let need = usageByMaterial[mat].need.length;
            if (!this.byMaterial[mat])
                throw new NotEnoughBriqs(mat);
            let copy = Object.assign({}, this.byMaterial[mat]);
            copy.ft_balance -= usageByMaterial[mat].ft_balance;
            copy.nft_ids = copy.nft_ids.filter(x => usageByMaterial[mat].nft_ids.indexOf(x) === -1);
            for (let i = 0; i < need; ++i)
            {
                let br: Briq;
                if (copy.ft_balance > 0)
                {
                    --copy.ft_balance;
                    br = new Briq(mat, parseInt(mat, 16), "")
                    br.id = mat;
                }
                else if (copy.nft_ids.length)
                {
                    br = new Briq(copy.nft_ids.pop()!, parseInt(mat, 16), "")
                    br.id = br.temp_id;
                }
                else
                    throw new NotEnoughBriqs(mat);
                br.onChain = true;
                swaps.push({ pos: usageByMaterial[mat].need[i], newBriq: br });
            }
        }
        return swaps;
    }
}

export function createChainBriqs()
{
    return reactive(new ChainBriqs()).watch();
}