import { reactive, watchEffect } from 'vue'
import { BriqsData } from './BriqsData';
import { SetData } from './SetData';

export var builderData = reactive((() => {
    let briqsData = new BriqsData();
    let currentSet = new SetData(0, briqsData);
    return {
        briqsData,
        currentSet,
    }
})());

watchEffect(() => {
    window.localStorage.setItem("briq_set_" + builderData.currentSet.id, JSON.stringify(builderData.currentSet.serialize()));
});
