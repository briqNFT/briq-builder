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
            return JSON.stringify(Array.from(builderData.currentSet.briqs.values()).map(x => Array.from(x)), undefined, 4);
        }
    }
})
</script>

<style scoped>
#debugWindow
{
    position:fixed;
    top:5rem;
    right:0;
    width: 200px;
}
</style>
