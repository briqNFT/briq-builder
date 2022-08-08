<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
    size?: string
}>();

const window = ref(null as unknown as HTMLDivElement);

const _size = computed(() => props?.size || 'md:w-2/5 w-auto');

// This doesn't use Vue's system to allow bubbling up.
const close = () => window.value.dispatchEvent(new CustomEvent('_close', { bubbles: true }));

</script>

<template>
    <div ref="window" :class="'container p-0 rounded-lg bg-grad-lightest alternate-buttons m-8 shadow-xl relative ' + _size">
        <div class="relative h-full px-4 py-4">
            <div class="flex justify-between items-center px-4 pt-2 pb-4">
                <h3 class="font-semibold" v-if="!!$slots.title"><slot name="title"/></h3>
                <h2 class="font-semibold" v-if="!!$slots['big-title']"><slot name="big-title"/></h2>

                <button
                    @click="close"
                    class="text-lg inline-flex justify-center items-center">
                    <i class="fas fa-times"/>
                </button>
            </div>

            <slot name="content">
                <div class="px-8 relative py-4">
                    <slot/>
                </div>
            </slot>
        </div>
    </div>
</template>
