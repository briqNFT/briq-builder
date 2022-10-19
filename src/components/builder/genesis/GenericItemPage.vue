<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

defineProps<{
    status: 'FETCHING' | 'ERROR' | 'LOADED',
    attributes: { name: string, value: string }[]
}>();

</script>

<style scoped>
h2, :slotted(h2) {
    @apply text-lg font-semibold my-2;
}

p, :slotted(p) {
    @apply text-copy;
}

.attribute {
    @apply bg-grad-lightest rounded-md border border-grad-light p-6;
    @apply flex flex-col gap-3;
}
.attribute h3 {
    @apply text-md font-medium;
}
.attribute p {
    @apply text-md text-grad-dark break-all;
}
</style>

<template>
    <div class="relative">
        <Header/>
        <div>
            <div class="container m-auto min-h-[calc(100vh-4rem)]">
                <div class="flex flex-col-reverse md:grid md:grid-cols-[7fr_5fr] gap-6 my-6">
                    <div class="flex flex-col gap-6">
                        <div class="flex justify-center items-center h-[24rem] md:h-[36rem] bg-grad-lightest rounded-lg overflow-hidden border-grad-light border">
                            <template v-if="status === 'LOADED'">
                                <slot name="image"/>
                            </template>
                            <template v-else-if="status === 'FETCHING'">
                                <p>Loading image</p>
                            </template>
                            <div v-else><p>Error while loading data</p></div>
                        </div>
                        <div>
                            <h2>Attributes</h2>
                            <div class="grid grid-cols-4 gap-6">
                                <div v-for="attrib of attributes" :key="attrib.name" class="attribute">
                                    <h3>{{ attrib.name }}</h3>
                                    <p>{{ attrib.value }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <p class="mt-1 mb-4">
                            <a
                                @click="router.go(-1)"
                                class="hover:text-primary cursor-pointer !text-sm">
                                <i class="fa-solid fa-chevron-left mr-2"/> Go back
                            </a>
                        </p>
                        <slot/>
                    </div>
                </div>
                <div>
                    <slot name="other"/>
                </div>
            </div>
        </div>
        <Footer/>
    </div>
</template>