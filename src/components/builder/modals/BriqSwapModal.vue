<template>
    <div class="md:w-2/5 w-auto" style="height:60%;">
        <div class="relative h-full flex flex-col">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text-center w-full">Select briq to swap.</h3>
            <BriqTable class="overflow-auto" :briqs="briqs"
                :columns="['material']"
                @highlight="(x) => selectedBriq = x"
                @select="onSelect"
            ></BriqTable>
            <Btn v-if="selectedBriq" @click="onSelect(selectedBriq)">Swap</Btn>
        </div>
    </div>
</template>

<script lang="ts">
import BriqTable from '../BriqTable.vue';
import type { Briq } from '../../../builder/Briq';

import { defineComponent } from 'vue';
export default defineComponent({
    components: {
        BriqTable
    },
    data() {
        return {
            selectedBriq: undefined as Briq | undefined,
        }
    },
    inject: ["chainBriqs"],
    emits: ["close"],
    props: ["metadata"],
    computed: {
        briqs() {
            let ret: Array<Briq> = [];
            /*
            this.chainBriqs.DB.briqs.forEach((x: Briq) => {
                if (this.metadata.exclude && this.metadata.exclude.indexOf(x.id) !== -1)
                    return;
                if (x.partOfSet())
                    return;
                ret.push(x)
            })
            */
            return ret;
        }
    },
    methods: {
        onSelect(briq: Briq) {
            this.$emit("close", {
                briq: briq
            });
        },
    }
})
</script>