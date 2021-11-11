import { Ref, ref, reactive, watchEffect } from 'vue'
import { BriqsDB } from './BriqsDB';
import { SetData } from './SetData';

import { builderDataEvents, BuilderDataEvent } from './BuilderDataEvents'

export class BuilderData
{
    wipSets: Array<SetData>;
    currentSet: SetData;
    BriqsDB: BriqsDB;
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
