<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { useUnboxHelpers } from '@/builder/Unbox';
import { APP_ENV } from '@/Meta';
import { computed, ref } from 'vue';
import Window from '@/components/generic/Window.vue';

const emit = defineEmits(['close'])

const props = defineProps<{
    boxId: string
}>();

const { unbox, fakeUnbox } = useUnboxHelpers();

const genesisStore = useGenesisStore();

const boxData = computed(() => genesisStore.metadata[props.boxId]._data);

const disableButtons = ref(false);

const doUnbox = async () => {
    disableButtons.value = true;
    try {
        await unbox(props.boxId);
        emit('close', true);
    } catch(_) { /**/ }
    disableButtons.value = false;
}
const doFakeUnbox = async () => {
    await fakeUnbox(props.boxId);
    emit('close', true);
}
</script>

<style scoped>
* {
    @apply leading-normal;
}
</style>

<template>
    <Window>
        <template #big-title>Unboxing</template>
        <p>
            Opening the {{ boxData?.name ? `'${boxData.name}' ` : ' ' }}box will burn it forever.<br>
            In exchange, its content will be available to you.
        </p>
        <ul class="list-inside my-4 list-disc">
            <li>One official booklet, allowing you to build the matching authentified set</li>
            <li>{{ boxData?.briqs?.length ?? '...' }} briqs to build the set</li>
            <li>{{ boxData?.briqs?.length ?? '...' }} extra briqs to make whatever your heart desires</li>
        </ul>
        <div class="mt-8 flex justify-end gap-4">
            <Btn :disabled="disableButtons" v-if="APP_ENV !== 'prod'" no-background @click="doFakeUnbox">Fake Unbox</Btn>
            <Btn :disabled="disableButtons" secondary @click="$emit('close')">Cancel</Btn>
            <Btn :disabled="disableButtons" @click="doUnbox">Unbox</Btn>
        </div>
    </Window>
</template>