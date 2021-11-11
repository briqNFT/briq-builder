<template>
    <div id="debugWindow">
        <p>{{ builderDataRepr }}</p>
    </div>
</template>

<script lang="ts">
import { builderData } from '../builder/BuilderData';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            builderData: builderData
        }
    },
    computed: {
        builderDataRepr: function() {
            let ret = [];
            builderData.currentSet.forEach(cell => ret.push(cell));
            return JSON.stringify(ret);
            //return JSON.stringify(Array.from(builderData.currentSet.briqs.values()).map(x => Array.from(x)), undefined, 4);
            //return JSON.stringify(Array.from(builderData.BriqsDB.briqs.values()));
            //return JSON.stringify(Array.from(builderData.currentSet.briqs.values()));
        }
    }
})
</script>

<style scoped>
#debugWindow
{
    max-height: 300px;
    overflow: scroll;
}
</style>
