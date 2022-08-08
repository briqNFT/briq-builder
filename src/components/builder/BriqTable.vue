<template>
    <div>
        <table class="text-justify font-mono text-xs">
            <tr>
                <th>ID</th>
                <th v-if="show('material')">Material</th>
                <th v-if="show('color')">Color</th>
                <th v-if="show('set')">Set</th>
            </tr>
            <tr
                v-for="(briq, i) of briqs"
                @click="onClick(i)"
                @dblclick="onDoubleClick(i)"
                :class="i == selected ? 'bg-primary' : ''">
                <template v-if="isActualBriq(briq)">
                    <td>{{ briq.id }}</td>
                    <td v-if="show('material')" class="bg-primary bg-opacity-30">{{ briq.material }}</td>
                    <td v-if="show('color')">{{ briq.color }}</td>
                    <td v-if="show('set')" class="bg-primary bg-opacity-30">{{ briq.set }}</td>
                </template>
                <template v-else="">
                    <td>{{ briq.token_id || 'Fungible x' + briq.qty }}</td>
                    <td v-if="show('material')" class="bg-primary bg-opacity-30">{{ briq.material }}</td>
                    <td v-if="show('color')"/>
                    <td v-if="show('set')" class="bg-primary bg-opacity-30"/>
                </template>
            </tr>
        </table>
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
import { Briq } from '../../builder/Briq';

import { defineComponent, ref } from 'vue';
export default defineComponent({
    data() {
        return {
            selected: -1,
        };
    },
    emits: ['highlight', 'select'],
    props: ['briqs', 'columns'],
    methods: {
        isActualBriq(d: any) {
            return d instanceof Briq;
        },
        show(col: string) {
            if (!this.columns)
                return true;
            return this.columns.indexOf(col) !== -1;
        },
        onClick(i: number) {
            this.$emit('highlight', this.briqs[i]);
            this.selected = i;
        },
        onDoubleClick(i: number) {
            this.selected = i;
            this.$emit('select', this.briqs[i]);
        },
    },
});
</script>
