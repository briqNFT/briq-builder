<template>
    <div class="md:w-2/5 w-auto" style="height:60%;">
        <div class="relative h-full">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text-center w-full">Briq Details</h3>
            <div class="flex gap-2">
                <Button @click="setup = 'all'">On-chain</Button>
                <Button @click="setup = 'current'">Local set</Button>
                <!-- TODO -->
                <!--<Button v-for="set of sets" @click="setup = 'set'">Set {{ set }}</Button>-->
            </div>
            <div class="h-5/6 overflow-auto">
                <table class="text-justify font-mono text-xs">
                    <tr><th>ID</th><th>Color</th><th>Material</th><th>Set</th></tr>
                    <tr v-for="[id, briq] of briqs">
                        <td>{{ id }}</td>
                        <td class="bg-briq-light bg-opacity-30">{{ briq.color }}</td>
                        <td>{{ briq.material }}</td>
                        <td class="bg-briq-light bg-opacity-30">{{ briq.set }}</td>
                    </tr>
                </table>
           </div>
        </div>
    </div>
</template>

<style scoped>
tr {
    @apply text-right p-1;
}
td {
    @apply px-1 py-0.5;
}
</style>

<script lang="ts">
import type { Briq } from '../../../builder/BriqsDB'

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            setup: "all",
        };
    },
    computed: {
        sets(): Array<string> {
            return this.$store.state.builderData.chainSets
        },
        briqs(): Array<[string, Briq]> {
            if (this.setup === "all")
                return Array.from(this.$store.state.builderData.briqsDB.briqs as Map<string, Briq>);
            else if (this.setup === "current")
                return Array.from(this.$store.state.builderData.currentSet.briqsDB.briqs as Map<string, Briq>);
            else
                return [];
        }
    },
    methods: {},
    props: ["metadata"],
    emits: ["close"],
})
</script>
