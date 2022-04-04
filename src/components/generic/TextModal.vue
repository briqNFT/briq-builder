<template>
    <Window @close="$emit('close')">
        <template #big-title>{{ metadata.title }}</template>
        <p class="text-lg font-medium my-4">{{ metadata.text }}</p>
        <div class="flex justify-around">
            <p v-for="btn, i of metadata.buttons">
                <Btn class="min-w-[8rem]" :tooltip="btn.tooltip" @click="$emit('close', i)">{{ btn.text }}</Btn>
            </p>
        </div>
    </Window>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    props: ['metadata'],
    emits: ["close"],
})
</script>
