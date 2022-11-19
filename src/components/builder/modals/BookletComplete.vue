<script setup lang="ts">
import Window from '@/components/generic/Window.vue';
import ExportSet from './ExportSet.vue';
import { pushModal } from '@/components/Modals.vue';
import { useBuilder } from '../BuilderComposable';

const emit = defineEmits(['close']);

const { currentSet } = useBuilder();

const setModal = async () => {
    await pushModal(ExportSet, {
        setId: currentSet.value.id,
        background: 'rgba(0, 0, 0, 0.0)',
    });
    emit('close');
}
</script>

<style scoped>
p {
    @apply leading-snug;
}</style>

<template>
    <Window size="lg:w-[40rem] w-auto">
        <template #title>Your set is fully built!</template>
        <p class="mt-4">You've done it!<br>You can now mint your set.</p>
        <p class="mt-2 mb-4">Or, if you prefer, you can just enjoy the nice confettis.</p>
        <div class="flex gap-3 justify-end">
            <div class="flex-1 grow-[5]"/>
            <Btn class="flex-1" secondary @click="$emit('close')">Cancel</Btn>
            <Btn class="flex-1" @click="setModal">Mint</Btn>
        </div>
        <canvas ref="particlesCanvas" class="fixed w-screen h-screen top-0 left-0 pointer-events-none"/>
    </Window>
</template>
