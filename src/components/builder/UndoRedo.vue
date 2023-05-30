<script setup lang="ts">
import { builderHistory } from '@/builder/BuilderHistory';
import { computed } from 'vue';

const canUndo = computed(() => builderHistory.command_index > 0);
const canRedo = computed(() => builderHistory.command_index < builderHistory.command_history.length - 1);
</script>

<template>
    <div>
        <Hotkey name="undo" :data="{ onDown: true, key: 'z', ctrl: true }" :handler="() => builderHistory.undo()"/>
        <Hotkey name="redo" :data="{ onDown: true, key: 'z', ctrl: true, shift: true }" :handler="() => builderHistory.redo()"/>
        <Btn v-bind="$attrs" @click="builderHistory.undo()" :disabled="!canUndo" class="w-8 h-8 md:w-10 md:h-10" tooltip="Undo (Ctrl + Z)">
            <p><i class="fas fa-undo"/></p>
        </Btn>
        <Btn v-bind="$attrs" @click="builderHistory.redo()" :disabled="!canRedo" class="w-8 h-8 md:w-10 md:h-10" tooltip="Redo (Ctrl + Shift + Z)">
            <p><i class="fas fa-redo"/></p>
        </Btn>
    </div>
</template>
