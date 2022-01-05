<template>
    <div class="md:w-2/5 w-auto">
        <div class="relative h-full">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full">{{ metadata.title }}</h2>
            <p class="text-lg font-medium my-4">{{ metadata.text }}</p>
            <div class="flex justify-around">
                <p v-for="btn, i of metadata.buttons">
                    <Button class="min-w-[8rem]" :tooltip="btn.tooltip" @click="$emit('close', i)">{{ btn.text }}</Button>
                </p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    props: ['metadata'],
    emits: ["close"],
})
</script>
