<script setup lang="ts">
import Contract from './Contract.vue'
import Button from './generic/Button.vue';
</script>

<template>
    <div class="alternate-buttons">
        <h1>Admin</h1>
        <Contract/>

        <Button @click="init1">Initialize Briq</Button>
        <Button @click="init2">Initialize Set</Button>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    methods: {
        async init1() {
            let bd = this.$store.state.builderData;
            let tx = await bd.briqContract.initialize(bd.setContract.connectedTo, bd.mintContract.connectedTo);
            console.log(tx);
        },
        async init2() {
            let bd = this.$store.state.builderData;
            let tx = await bd.setContract.initialize(bd.briqContract.connectedTo);
            console.log(tx);
        }
    }
})
</script>