<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BoxListing from './BoxListing.vue';
import ModalsVue, { pushModal } from '@/components/Modals.vue';
import BidModalVue from './BidModal.vue';
import { useGenesisStore } from '@/builder/GenesisStore';

const route = useRoute();
const router = useRouter();

const placeBid = () => {
    pushModal(BidModalVue);
}

const genesisStore = useGenesisStore();

const token_id = computed(() => `${route.params.theme}/${route.params.box}`);
const itemData = computed(() => genesisStore.metadata[token_id.value]);

const themeName = computed(() => route.params.theme);
const boxName = computed(() => itemData.value._data?.name ?? route.params.box);

</script>

<style scoped>
.theme-box-page {
    @apply bg-gray-100 text-black;
}

h2 {
    @apply text-lg font-medium my-2;
}
p {
    @apply text-copy;
}

.auction-countdown {
    @apply border border-darker rounded bg-base;
}

.auction-countdown > div {
    @apply border-r border-darker py-4;
}

.auction-countdown > div:last-child {
    @apply border-r-0;
}

.attribute {
    @apply bg-base rounded-md border border-darker p-6;
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
    <div class="relative theme-box-page">
        <Header/>
        <div>
            <div class="container m-auto">
                <p class="my-6">
                    <a
                        @click="router.go(-1)"
                        class="text-accent">
                        <Btn>
                            <i class="fa-solid fa-arrow-left"/> Go back
                        </Btn>
                    </a>
                </p>
                <div class="grid grid-cols-[8fr_4fr] gap-6">
                    <div class="flex flex-col gap-6">
                        <div class="flex justify-center items-center min-h-[34rem] bg-base rounded-lg border-darker border">
                            <img v-if="itemData._status !== 'ERROR'" :src="genesisStore.coverItemRoute(token_id)">
                            <div v-else><p>Error while loading box data</p></div>
                        </div>
                        <div>
                            <h2>Description</h2>
                            <p class="my-4">
                                {{ itemData._data?.description ?? 'Loading' }}
                                Association of briqs are named sets.<br><br>
                                Sets can be disassembled to get the briqs back and create something new.<br><br>
                                They can be combined to create even more complex structures.
                            </p>
                        </div>
                        <div>
                            <h2>Attributes</h2>
                            <div class="grid grid-cols-4 gap-6">
                                <div class="attribute">
                                    <h3>Serial Number</h3>
                                    <p>#55</p>
                                </div>
                                <div class="attribute">
                                    <h3>Pieces</h3>
                                    <p>{{ itemData?._data?.briqs?.length }}</p>
                                </div>
                                <div class="attribute">
                                    <h3>Theme</h3>
                                    <p>{{ themeName }}</p>
                                </div>
                                <div class="attribute">
                                    <h3>Year</h3>
                                    <p>2022</p>
                                </div>
                                <div class="attribute">
                                    <h3>Condition</h3>
                                    <p>Unopened</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-6">
                        <h1 class="text-lg font-semibold">{{ boxName }}</h1>
                        <div>
                            <h2>Sale ends on</h2>
                            <p class="my-4">July 1, 2022 at 11:32 AM GMT+1</p>
                            <div class="grid grid-cols-4 auction-countdown">
                                <div
                                    v-for="i in [['Days', 2], ['Hours', 1], ['Minutes', 24], ['Seconds', 43]]" :key="i[0]"
                                    class="inline-flex flex-col justify-around items-center">
                                    <p class="text-xl font-medium">{{ ('' + i[1]).padStart(2, '0') }}</p>
                                    <p class="text-copy font-medium">{{ i[0] }}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2>Winning Bid</h2>
                            <p class="text-xl font-medium my-4"><i class="fa-brands fa-ethereum"/> 1.35</p>
                            <Btn class="text-white" :disabled="itemData._status === 'ERROR'" @click="placeBid">Place a bid</Btn>
                        </div>
                        <h2>Previous bids</h2>
                        <div class="flex flex-col gap-2 pt-2">
                            <div v-for="i in new Array(5)" class="flex justify-between">
                                <p>0xcafe0123babe</p>
                                <p>1.35 eth <i class="pl-2 fa-solid fa-arrow-up-right-from-square"/></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 class="my-8">Other sets from this theme</h2>
                    <BoxListing/>
                </div>
            </div>
        </div>
        <Footer/>
    </div>
    <ModalsVue/>
</template>