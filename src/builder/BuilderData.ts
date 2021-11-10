import { Ref, ref, reactive, watchEffect } from 'vue'
import { BriqsData } from './BriqsData';
import { SetData } from './SetData';

import { builderDataEvents, BuilderDataEvent } from './BuilderDataEvents'

class BuilderData
{
    wipSets: Array<SetData>;
    currentSet: SetData;
    briqsData: BriqsData;
    constructor()
    {
        this.briqsData = new BriqsData();
        this.wipSets = [];
        let ids = (window.localStorage.getItem("briq_set_ids")?.split(',') || []).map(x => +x);
        for (let sid of ids)
        {
            try
            {
                let data = JSON.parse(window.localStorage.getItem("briq_set_" + sid));
                let set = new SetData(data.id, this.briqsData).deserialize(data);
                this.wipSets.push(set);
            }
            catch (e)
            {
                console.warn("Error loading local set:", e)
            };
        }
        if (!this.wipSets.length)
            this.newSet();
        this.currentSet = this.wipSets[0];
    }

    newSet()
    {
        this.wipSets.push(new SetData(Date.now(), this.briqsData));
        if (!!this.currentSet)
            this.currentSet = this.wipSets[this.wipSets.length - 1];
        builderDataEvents.push(new BuilderDataEvent("change_set"));
    }

    selectSet(setId: number)
    {
        let idx = this.wipSets.findIndex(x => x.id === setId);
        this.currentSet = this.wipSets[idx];
        builderDataEvents.push(new BuilderDataEvent("change_set"));
    }

    disassembleSet(setId: number)
    {
        let idx = this.wipSets.findIndex(x => x.id === setId);
        this.wipSets.splice(idx, 1);
        if (!this.wipSets.length)
            this.newSet();
        this.currentSet = this.wipSets[0];
        builderDataEvents.push(new BuilderDataEvent("change_set"));
    }
}

export var builderData = reactive(new BuilderData());

watchEffect(() => {
    // TODO: switch to IDB
    window.localStorage.setItem("briq_set_ids", builderData.wipSets.map(x => x.id).join(','));
    window.localStorage.setItem("briq_set_" + builderData.currentSet.id, JSON.stringify(builderData.currentSet.serialize()));
});
