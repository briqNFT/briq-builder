<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BoxListing from './BoxListing.vue';
import ModalsVue, { pushModal } from '@/components/Modals.vue';
import BidModalVue from './BidModal.vue';
import { useGenesisStore } from '@/builder/GenesisStore';

const router = useRouter();
const route = useRoute();

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

div.box-page-block {
    @apply border-[1px] bg-white p-4 border-gray-200 rounded-md;
}
h4 {
    @apply text-md font-semibold my-2;
}
p {
    @apply text-copy;
}
</style>

<template>
    <div class="relative theme-box-page">
        <Header/>
        <div>
            <div class="container m-auto my-8">
                <p>
                    <routerLink
                        :to="{ name: 'Theme', 'params': { 'theme': 'test' } }"
                        class="text-accent">
                        {{ themeName }}
                    </routerLink> > {{ boxName }}
                </p>
                <div class="grid grid-cols-[8fr_4fr] gap-4">
                    <div class="grid-span flex justify-center items-center min-h-[20rem]">
                        <img :src="genesisStore.coverItemRoute(token_id)">
                    </div>
                    <div class="flex flex-col">
                        <routerLink
                            :to="{ name: 'Theme', 'params': { 'theme': 'test' } }">
                            <h3 class="text-md text-accent">{{ themeName }}</h3>
                        </routerLink>
                        <h1 class="text-xl my-8">{{ boxName }}</h1>
                        <div class="box-page-block flex-1 flex flex-col justify-between">
                            <div>
                                <h4>Sale ends on</h4>
                                <p>July 1, 2022 at 11:32 AM GMT+1</p>
                                <div>AUCTION TIME BLOCK HERE</div>
                            </div>
                            <div>
                                <h4>Winning Bid</h4>
                                <p>1.35 ETH</p>
                                <Btn class="w-full text-white" @click="placeBid">Place a bid</Btn>
                            </div>
                        </div>
                    </div>
                    <div class="box-page-block">
                        <h4>Description</h4>
                        <p class="my-4">
                            {{ itemData._data.description ?? 'Loading' }}
                            Association of briqs are named sets.<br><br>
                            Sets can be disassembled to get the briqs back and create something new.<br><br>
                            They can be combined to create even more complex structures.
                        </p>
                        <p class="font-medium mt-12">WARNING: NO CHOKING HAZARD. Suitable for all humans and cyborgs.</p>
                    </div>
                    <div class="box-page-block">
                        <h4>Previous bids</h4>
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