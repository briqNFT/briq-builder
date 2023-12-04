<script setup lang="ts">
import { walletStore } from '@/chain/Wallet';
import { computed, ref } from 'vue';
import Window from '../generic/Window.vue';

defineEmits(['close']);

// Initial text as props
const props = withDefaults(defineProps<{
    initialMapping: Record<string, string>;
}>(), {
    initialMapping: () => ({
        [walletStore.userWalletAddress || '0x0']: '0x1',
    }),
});

const recipientMapping = ref(props.initialMapping);

const recipientMappingText = computed({
    get: () => JSON.stringify(recipientMapping.value, undefined, 4),
    set: (v) => recipientMapping.value = JSON.parse(v),
});

const step = ref('JSON' as 'JSON' | 'CONFIRM');
</script>

<template>
    <Window size="w-full max-w-[80rem]">
        <template #title>Recipient mapping</template>
        <template v-if="step == 'JSON'">
            <textarea v-model="recipientMappingText" class="w-full min-h-[20rem]"/>
            <div class="flex gap-4 justify-end items-center">
                <Btn @click="step = 'CONFIRM'">Confirm</Btn>
            </div>
        </template>
        <template v-else>
            <p class="w-full h-32 text-xs whitespace-pre">{{ JSON.stringify(recipientMapping, null, 4) }}</p>
            <div class="flex gap-4 justify-end items-center">
                <Btn secondary @click="step = 'JSON'">Back</Btn>
                <Btn @click="$emit('close', recipientMapping)">Confirm</Btn>
            </div>
        </template>
    </Window>
</template>
