import { SetData } from '../../../builder/SetData';
import { ADDRESSES } from '../../../Contracts';
import { LegacySetContract } from '../../../contracts/set';
import getBaseUrl, { fetchData } from '../../../url';

class LegacySetsMgr
{
    oldSets = [] as string[];
    oldSetsData = {} as { [sid: string]: SetData };
    oldSetsImg = {} as { [sid: string]: string };
    legacyContract!: LegacySetContract;
    
    async setup(store: any)
    {
        this.legacyContract = new LegacySetContract(ADDRESSES['starknet-testnet-legacy'].set, store.signer);
        let sets = await this.legacyContract.balanceDetailsOf(store.userWalletAddress);
        for (let set of sets)
        this.oldSets.push(set);
        let fetchSetData = async (sid: string) => {
            let data = (await fetchData("store_get/" + sid)).data;
            return new SetData(sid).deserialize(data);
        };
        this.oldSets.forEach(async (sid: string) => {
            try {
                let set = await fetchSetData(sid);
                this.oldSetsData[sid] = set;
            } catch(_) {}
        });
        this.oldSets.forEach(async (sid: string) => {
            let src = new Image();
            src.crossOrigin = "anonymous";
            src.src = getBaseUrl() + "/preview/" + sid;
            try {
                await src.decode();
                this.oldSetsImg[sid] = src;
            } catch (_) {}
        });
    }
}

import { reactive } from 'vue';
export const legacySetsMgr = reactive(new LegacySetsMgr());
