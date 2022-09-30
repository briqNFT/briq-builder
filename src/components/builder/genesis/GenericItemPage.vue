<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

defineProps<{
    status: 'FETCHING' | 'ERROR' | 'LOADED',
    description: string | undefined,
    attributes: { name: string, value: string }[]
}>();

</script>

<style scoped>
h2, :slotted(h2) {
    @apply text-lg font-medium my-2;
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
    @apply text-lg;
}
</style>

<template>
    <div class="relative">
        <Header/>
        <div>
            <div class="container m-auto">
                <p class="my-6">
                    <a
                        @click="router.go(-1)"
                        class="text-primary">
                        <Btn secondary no-background>
                            <i class="fa-solid fa-chevron-left"/> Go back
                        </Btn>
                    </a>
                </p>
                <div class="grid grid-cols-[8fr_4fr] gap-6 mb-8">
                    <div class="flex flex-col gap-6">
                        <div class="flex justify-center items-center min-h-[34rem] bg-grad-lightest rounded-lg border-grad-light border">
                            <template v-if="status === 'LOADED'">
                                <slot name="image"/>
                            </template>
                            <template v-else-if="status === 'FETCHING'">
                                <p>Loading image</p>
                            </template>
                            <div v-else><p>Error while loading data</p></div>
                        </div>
                        <div>
                            <h2>Description</h2>
                            <p class="my-4">
                                {{ description ?? 'Loading' }}
                            </p>
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
                    <div class="flex flex-col gap-6">
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