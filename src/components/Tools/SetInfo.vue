<template>
    <div>
        <h2>Set Info</h2>
        <p>ID: {{ set.id }}</p>
        <p>Name: <input type="text" v-model="set.name"></p>
        <p><button @click="swapReal">Swap for real briqs</button></p>
        <p><button @click="makeCopy">Make Copy</button></p>
        <p><button @click="disassemble">Disassemble Set</button></p>
    </div>
</template>

<script lang="ts">
import { defineComponent, toRef } from 'vue';
import { builderData } from '../../builder/BuilderData';

export default defineComponent({
    data() {
        return {
            set: toRef(builderData, "currentSet"),
        };
    },
    methods: {
        disassemble: function() {
            builderData.disassembleSet(this.set.id);
        },
        swapReal: function() {
            this.set.swapForRealBriqs(builderData.BriqsDB);
        },
        makeCopy: function() {

        }
    }
})
</script>

<style scoped>
div p {
    text-align: left;
}
</style>
