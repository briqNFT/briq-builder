<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
    size?: string
}>();

const window = ref(null as unknown as HTMLDivElement);

const _size = computed(() => props?.size || 'md:w-4/5 lg:w-3/5 max-w-[40rem] w-auto');

// This doesn't use Vue's system to allow bubbling up.
const close = () => window.value.dispatchEvent(new CustomEvent('_close', { bubbles: true }));

</script>

<style scoped>
.dark #app .tempdarkfix {
    @apply border border-grad-light shadow-none;
}
</style>

<template>
    <div ref="window" :class="'container p-0 rounded-md md:rounded-lg bg-grad-lightest alternate-buttons m-2 sm:m-4 md:m-8 shadow-xl tempdarkfix relative ' + _size">
        <div class="relative h-full p-4 md:p-6">
            <div class="flex justify-between items-center pb-6">
                <h4 class="font-semibold w-full flex items-center" v-if="!!$slots.title"><slot name="title"/></h4>
                <h2 class="font-semibold w-full flex items-center" v-if="!!$slots['big-title']"><slot name="big-title"/></h2>

                <button
                    @click="close"
                    class="text-xl inline-flex justify-center items-center h-6 w-6 p-0">
                    <i class="far fa-xmark"/>
                </button>
            </div>

            <slot name="content">
                <div class="relative">
                    <slot/>
                </div>
            </slot>
        </div>
    </div>
</template>
