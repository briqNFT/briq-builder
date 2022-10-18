<script setup lang="ts">
import { getCurrentNetwork } from '@/chain/Network';
import { APP_ENV } from '@/Meta';
import { ref, watch } from 'vue';
import Window from './generic/Window.vue';

const opened = ref(false);

watch([() => getCurrentNetwork()], () => {
    if (APP_ENV === 'prod' && getCurrentNetwork() === 'starknet-testnet')
        opened.value = true;
    if (APP_ENV === 'test' && getCurrentNetwork() === 'starknet-mainnet')
        opened.value = true;
}, {
    immediate: true,
})
</script>

<style scoped>
p {
    @apply mb-4 leading-normal;
}
</style>

<template>
    <div v-if="opened" class="fixed top-0 left-0 h-full w-full flex justify-center items-center bg-black bg-opacity-50 z-[50000]">
        <Window @_close="opened=false" @close="opened=false">
            <template #title>Briq is switching to Starknet Mainnet</template>
            <div class="my-8">
                <p>
                    Briq will launch on mainnet soon! <br>
                    If you want to play with briq on testnet, go to <a class="text-primary" href="old.briq.construction" target="_blank">old.briq.construction</a>
                </p>
                <p>Otherwise, please connect a mainnet wallet !</p>
            </div>
            <Btn class="float-right mb-4" secondary @click="opened = false">Close</Btn>
        </Window>
    </div>
</template>
