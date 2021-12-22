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
import contractStore from '../Contracts';

import { defineComponent } from 'vue';
export default defineComponent({
    methods: {
        async init1() {
            let tx = await contractStore.briq.initialize(contractStore.set.connectedTo, contractStore.mint.connectedTo, contractStore.briq_erc20.connectedTo );
            console.log(tx);
        },
        async init2() {
            let tx = await contractStore.set.initialize(contractStore.briq.connectedTo);
            console.log(tx);
        }
    }
})
</script>