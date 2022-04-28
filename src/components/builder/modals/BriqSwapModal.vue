<template>
    <Window style="height: 60%">
        <template #title>Select briq to swap.</template>
        <BriqTable
            class="overflow-auto"
            :briqs="briqs"
            :columns="['material']"
            @highlight="(x) => (selectedBriq = x)"
            @select="onSelect"/>
        <Btn v-if="selectedBriq" @click="onSelect(selectedBriq)">Swap</Btn>
    </Window>
</template>

<script lang="ts">
import BriqTable from '../BriqTable.vue';
import type { Briq } from '../../../builder/Briq';

import { defineComponent } from 'vue';
export default defineComponent({
    components: {
        BriqTable,
    },
    data() {
        return {
            selectedBriq: undefined as Briq | undefined,
        };
    },
    inject: ['chainBriqs'],
    props: ['metadata'],
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
        },
    },
    methods: {
        onSelect(briq: Briq) {
            this.$emit('close', {
                briq: briq,
            });
        },
    },
});
</script>
