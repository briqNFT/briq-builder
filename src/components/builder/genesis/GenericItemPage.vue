<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { useRouter } from 'vue-router';
import MenuDropdown from '@/components/generic/MenuDropdown.vue';

import ShareIcon from '@/assets/share-nodes-light.svg';

const router = useRouter();

defineProps<{
    status: 'FETCHING' | 'ERROR' | 'LOADED',
    attributes: { name: string, value: string }[]
}>();

</script>

<style scoped>
h2, :slotted(h2), /deep/ h2 {
    @apply text-lg font-semibold my-2;
}

p, :slotted(p), /deep/ p {
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
                        <slot name="full-image" :status="status"/>
                        <div v-if="!$slots['full-image']" class="flex justify-center items-center h-[24rem] md:h-[36rem] bg-grad-lightest rounded-lg overflow-hidden border-grad-light border">
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
                            <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                                <div v-for="attrib of attributes" :key="attrib.name" class="attribute">
                                    <h3>{{ attrib.name }}</h3>
                                    <p>{{ attrib.value }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="mt-1 mb-4 flex justify-between items-center">
                            <a
                                @click="router.go(-1)"
                                class="hover:text-primary cursor-pointer !text-sm">
                                <i class="fa-solid fa-chevron-left mr-2"/> Go back
                            </a>
                            <div class="flex gap-2">
                                <MenuDropdown v-if="$slots.dropdown" icon no-background no-marker :must-click="true" class="!h-8 px-2 font-normal text-sm">
                                    <template #button>
                                        <ShareIcon class="mr-2"/> Share
                                    </template>
                                    <slot name="share"/>
                                </MenuDropdown>
                                <MenuDropdown v-if="$slots.dropdown" no-background :must-click="true" class="!h-8 !w-8 p-0">
                                    <template #icon>
                                        <i class="fa-regular fa-ellipsis text-lg"/>
                                    </template>
                                    <slot name="dropdown"/>
                                </MenuDropdown>
                            </div>
                        </div>
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