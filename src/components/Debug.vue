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
            //return JSON.stringify(Array.from(builderData.currentSet.briqs.values()).map(x => Array.from(x)), undefined, 4);
            return JSON.stringify(builderData.wipSets);
        }
    }
})
</script>

<style scoped>
</style>
