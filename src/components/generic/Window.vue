<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
    size?: string
}>();

const window = ref(null as unknown as HTMLDivElement);

const isv2design = document.documentElement.classList.contains('v2design');

const _size = computed(() => props?.size || 'md:w-2/5 w-auto');

// This doesn't use Vue's system to allow bubbling up.
const close = () => window.value.dispatchEvent(new CustomEvent('_close', { bubbles: true }));

</script>

<template>
    <div ref="window" :class="'container rounded-lg bg-base alternate-buttons m-8 shadow-xl relative ' + _size">
        <div class="relative h-full pt-2 pb-4" v-if="!isv2design">
            <!-- Center the title, but let it get pushed slightly left if needed for the close button.-->
            <h3 v-if="!!$slots.title" class="text-center w-full px-4 pb-2 flex justify-between">
                <span class="flex-1"/>
                <slot name="title"/>
                <span class="grow w-2"/>
            </h3>
            <h2 v-if="!!$slots['big-title']" class="text-center w-full px-4 pb-2 flex justify-between">
                <span class="flex-1"/>
                <slot name="big-title"/>
                <span class="grow w-2"/>
            </h2>

            <slot name="content">
                <div class="px-8 relative">
                    <slot/>
                </div>
            </slot>
            <button
                @click="close"
                class="absolute top-0.5 right-0.5 hover:text-sm text-xs font-light bg-accent h-5 w-5 rounded inline-flex justify-center items-center">
                <i class="fas fa-times"/>
            </button>
        </div>
        <div class="relative h-full pt-2 pb-4" v-else>
            <div class="flex justify-between items-center px-8 py-4">
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
