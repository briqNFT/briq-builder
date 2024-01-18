<script setup lang="ts">
import { walletStore } from '@/chain/Wallet';
import { computed, ref } from 'vue';
import Window from '../generic/Window.vue';

defineEmits(['close']);

// Initial text as props
const props = withDefaults(defineProps<{
    initialMapping: Record<string, Record<string, string>>;
}>(), {
    initialMapping: () => ({
        [walletStore.userWalletAddress || '0x0']: '0x1',
    }),
});

const recipientMapping = ref(props.initialMapping);

const recipientMappingText = ref('');

const step = ref('JSON' as 'JSON' | 'CONFIRM');

const confirmMapping = () => {
    // Mapping is a TSV text and the first column is the trait name
    const titles = recipientMappingText.value.split('\n')[0].split('\t');
    const mapping = recipientMappingText.value.split('\n').slice(1).map((line) => {
        const values = line.split('\t');
        const duckName = values[0];
        const traitMapping = Object.fromEntries(titles.slice(1).map((title, i) => [title, values[i + 1]]));
        return [duckName, traitMapping];
    });
    recipientMapping.value = Object.fromEntries(mapping);
    // Keep only the Family and Seasons traits for each duck
    Object.entries(recipientMapping.value).forEach(([duckName, traitMapping]) => {
        recipientMapping.value[duckName] = Object.fromEntries(Object.entries(traitMapping).filter(([traitName]) => traitName == 'Family' || traitName == 'Season'));
    });
    step.value = 'CONFIRM';
}
</script>

<template>
    <Window size="w-full max-w-[80rem]">
        <template #title>Recipient mapping</template>
        <template v-if="step == 'JSON'">
            <p>Enter a tab-separated table of items, with column names included (eg copy-paste from google sheets)</p>
            <textarea v-model="recipientMappingText" class="w-full min-h-[20rem]"/>
            <div class="flex gap-4 justify-end items-center">
                <Btn @click="confirmMapping">Confirm</Btn>
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
