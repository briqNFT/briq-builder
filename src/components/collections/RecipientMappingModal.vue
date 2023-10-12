<script setup lang="ts">
import { walletStore } from '@/chain/Wallet';
import { computed, ref } from 'vue';
import Window from '../generic/Window.vue';

defineEmits(['close']);

const recipientMapping = ref({
    [walletStore.userWalletAddress || '0x0']: '0x1',
} as Record<string, string>);

const recipientMappingText = computed({
    get: () => JSON.stringify(recipientMapping.value),
    set: (v) => recipientMapping.value = JSON.parse(v),
});

const step = ref('JSON' as 'JSON' | 'CONFIRM');
</script>

<template>
    <Window>
        <template #title>Recipient mapping</template>
        <template v-if="step == 'JSON'">
            <textarea v-model="recipientMappingText" class="w-full h-32"/>
            <div class="flex gap-4 justify-end items-center">
                <Btn @click="step = 'CONFIRM'">Confirm</Btn>
            </div>
        </template>
        <template v-else>
            <p class="w-full h-32 text-xs">{{ JSON.stringify(recipientMapping, null, 4) }}</p>
            <div class="flex gap-4 justify-end items-center">
                <Btn secondary @click="step = 'JSON'">Back</Btn>
                <Btn @click="$emit('close', recipientMapping)">Confirm</Btn>
            </div>
        </template>
    </Window>
</template>
