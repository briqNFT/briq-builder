<template>
    <div class="md:w-2/5 w-auto" style="height:60%;">
        <div class="relative h-full">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text-center w-full">Briq Details</h3>
            <div class="flex gap-2">
                <Btn @click="setup = 'all'">On-chain</Btn>
                <Btn @click="setup = 'current'">Local set</Btn>
                <!-- TODO -->
                <!--<Btn v-for="set of sets" @click="setup = 'set'">Set {{ set }}</Btn>-->
            </div>
            {{ chainBriqs.byTokenId }}
            <BriqTable :briqs="briqs"/>
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
import type { Briq } from '../../../builder/Briq'
import { setsManager } from '../../../builder/SetsManager';
import BriqTable from '../BriqTable.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    inject: ["chainBriqs"],
    data() {
        return {
            setup: "all",
        };
    },
    computed: {
        sets(): Array<string> {
            return setsManager.setList;
        },
        briqs(): ({ material: string, qty: number } | { material: string, token_id: string })[] {
            if (this.setup === "all")
                return this.chainBriqs.getBalanceDetails();
            else if (this.setup === "current")
                return this.$store.state.builderData.currentSet.serialize().briqs.map((x: any) => ({ material: x.data.material, token_id: x?.data?.id, qty: 1 }));
            else
               return [];
        }
    },
    methods: {},
    props: ["metadata"],
    emits: ["close"],
    components: { BriqTable }
})
</script>
