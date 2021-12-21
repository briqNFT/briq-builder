<template>
<div>
    <table class="text-justify font-mono text-xs">
        <tr>
            <th>ID</th>
            <th v-if="show('color')">Color</th>
            <th v-if="show('material')">Material</th>
            <th v-if="show('set')">Set</th>
        </tr>
        <tr v-for="briq, i of briqs" @click="onClick(i)" @dblclick="onDoubleClick(i)" :class="i == selected ? 'bg-briq-light' : '' ">
            <td>{{ briq.id }}</td>
            <td v-if="show('color')" class="bg-briq-light bg-opacity-30">{{ briq.color }}</td>
            <td v-if="show('material')">{{ briq.material }}</td>
            <td v-if="show('set')" class="bg-briq-light bg-opacity-30">{{ briq.set }}</td>
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
import type { Briq } from '../../builder/BriqsDB'

import { defineComponent, ref } from 'vue';
export default defineComponent({
    data() {
        return {
            selected: -1,
        }
    },
    emits: ["highlight", "select"],
    props: ["briqs", "columns"],
    methods: {
        show(col: string) {
            if (!this.columns)
                return true;
            return this.columns.indexOf(col) !== -1;
        },
        onClick(i: number) {
            this.$emit("highlight", this.briqs[i]);
            this.selected = i;
        },
        onDoubleClick(i: number) {
            this.selected = i;
            this.$emit("select", this.briqs[i]);
        }
    }
})
</script>
