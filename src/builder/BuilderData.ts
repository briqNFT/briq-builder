import { Ref, ref, reactive, watchEffect } from 'vue'
import { Briq, BriqsDB } from './BriqsDB';
import { SetData } from './SetData';

import { fetchData } from '../url'

import { builderDataEvents, BuilderDataEvent } from './BuilderDataEvents'

import { contractStore } from '../Wallet'

import BriqContract from '../contracts/briq'

export class BuilderData
{
    wipSets: Array<SetData>;
    currentSet: SetData;
    BriqsDB: BriqsDB;

    briqContract: BriqContract | undefined;
    //setContract: ;

    constructor()
    {
        this.BriqsDB = new BriqsDB();
        this.wipSets = [];
        for (let [sid, setData] of Object.entries(window.localStorage))
        {
            if (!sid.startsWith("briq_set"))
                continue;
            try
            {
                let data = JSON.parse(setData);
                let set = new SetData(data.id, this.BriqsDB).deserialize(data);
                this.wipSets.push(set);
            }
            catch (e)
            {
                window.localStorage.removeItem(sid);
            };
        }
        if (!this.wipSets.length)
            this.newSet();
        this.currentSet = this.wipSets[0];
        
        fetchData("contract_addresses").then(async x => {
            this.briqContract = new BriqContract(x.briq, contractStore.provider);
            //this.set_address = x.set;

            if (contractStore.userWalletAddress)
            {
                let bricks = await this.briqContract.get_all_tokens_for_owner(contractStore.userWalletAddress);
                builderData.BriqsDB.parseChainData(bricks.bricks as string[]);
            }
        })
    }

    newSet(): SetData
    {
        this.wipSets.push(new SetData(Date.now(), this.BriqsDB));
        if (!!this.currentSet)
            this.currentSet = this.wipSets[this.wipSets.length - 1];
        builderDataEvents.push(new BuilderDataEvent("change_set"));
        return this.currentSet;
    }

    selectSet(setId: number)
    {
        let idx = this.wipSets.findIndex(x => x.id === setId);
        this.currentSet = this.wipSets[idx];
        builderDataEvents.push(new BuilderDataEvent("change_set"));
    }

    disassembleSet(setId: number)
    {
        window.localStorage.removeItem("briq_set_" + setId);
        let idx = this.wipSets.findIndex(x => x.id === setId);
        this.wipSets.splice(idx, 1);
        if (!this.wipSets.length)
            this.newSet();
        this.currentSet = this.wipSets[this.wipSets.length - 1];
        builderDataEvents.push(new BuilderDataEvent("change_set"));
    }
}

export var builderData = reactive(new BuilderData());

watchEffect(() => {
    // TODO: switch to IDB
    window.localStorage.setItem("briq_set_" + builderData.currentSet.id, JSON.stringify(builderData.currentSet.serialize()));
});
