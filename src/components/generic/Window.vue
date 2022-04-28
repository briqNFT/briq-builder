<template>
    <div ref="window" :class="'container rounded-lg bg-base alternate-buttons m-8 shadow-xl relative ' + _size">
        <div class="relative h-full pt-2 pb-4">
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
                class="absolute top-0.5 right-0.5 hover:text-sm text-xs font-light bg-accent h-5 w-5 rounded-md inline-flex justify-center items-center">
                <i class="fas fa-times"/>
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    props: ['size'],
    computed: {
        _size(): string {
            return this.$props?.size || 'md:w-2/5 w-auto';
        },
    },
    methods: {
        close() {
            // This doesn't use Vue's system to allow bubbling up.
            this.$refs.window.dispatchEvent(new Event('close'));
        },
    },
});
</script>
