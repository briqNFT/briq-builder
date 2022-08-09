<script setup lang="ts">
import Header from '../landing_page/Header.vue';
import Footer from '../landing_page/Footer.vue';

import BriqsOverlayB from '@/assets/landing/briqs-bottom.svg';
import BriqsOverlayT from '@/assets/landing/briqs-top.svg';
import BriqsOverlayR from '@/assets/landing/briqs-right.svg';

import ProfileIcon from '@/assets/profile/profile.svg';

import { maybeStore } from '@/chain/WalletLoading';

import { computed, ref } from 'vue';
import { userBoxesStore } from '@/builder/UserBoxes';
import { userBookletsStore } from '@/builder/UserBooklets';
import { userBidsStore } from '@/builder/BidStore';
import BoxListing from '../builder/genesis/BoxListing.vue';
import { setsManager } from '@/builder/SetsManager';
import MenuDropdown from '../generic/MenuDropdown.vue';
import { useSetHelpers } from '../builder/SetComposable';

const sections = ['Sealed boxes', 'Booklets', 'Genesis Sets', 'Personal creations'];

const activeTab = ref('INVENTORY' as 'INVENTORY' | 'ACTIVITY');

const shoppingSections = ['Ongoing Auction Bids', 'Purchased Items']

const creations = computed(() => {
    return Object.values(setsManager.setsInfo).map(x => x.local!);
})

const {
    openSetInBuilder,
    duplicateSet,
    deleteLocalSet,
} = useSetHelpers();
</script>

<style scoped>
.imagePlaceholder {
    background: repeating-linear-gradient(
        -45deg,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0),
        10px,
        rgba(247, 137, 74, 0.5) 10px,
        rgba(247, 137, 74, 0.5) 15px
    );
}

</style>

<template>
    <Header/>
    <div class="bg-[#FFD215] relative w-full h-[9rem] tall-lg:h-[12rem] overflow-hidden">
        <div class="container m-auto relative">
            <div class="absolute left-[-100px] bottom-[-250px]"><BriqsOverlayB/></div>
            <div class="absolute top-0 left-[800px]"><BriqsOverlayT/></div>
            <div class="absolute top-0 right-[-100px]"><BriqsOverlayR/></div>
        </div>
    </div>
    <div class="bg-grad-lightest p-8 pb-0 flex flex-col items-center border-b border-grad-light">
        <div class="relative bottom-[6rem] right-[4rem] pb-[4rem]">
            <div class="absolute z-50 h-[8rem] w-[8rem] bg-grad-lighter border-4 border-grad-lightest rounded-md shadow-md flex justify-center items-center">
                <ProfileIcon width="100%" height="100%"/>
            </div>
        </div>
        <div/>
        <h2>{{ maybeStore?.userWalletAddress || 'No wallet selected' }}</h2>
        <p class="my-4"><span class="font-medium">Available briqs:</span> 800/1200</p>
        <div class="flex gap-12 mt-8">
            <p :class="activeTab === 'INVENTORY' ? 'pb-4 border-b-4 border-primary' : 'hover:cursor-pointer'" @click="activeTab = 'INVENTORY'">Inventory</p>
            <p :class="activeTab === 'ACTIVITY' ? 'pb-4 border-b-4 border-primary' : 'hover:cursor-pointer'" @click="activeTab = 'ACTIVITY'">Shopping Activity</p>
        </div>
    </div>
    <div v-if="activeTab === 'INVENTORY'" class="container m-auto my-8 grid grid-cols-[3fr_9fr]">
        <div>
            <h2>Inventory</h2>
            <div class="mt-4 flex flex-col gap-2">
                <Btn no-background class="text-left" v-for="section of sections">{{ section }}</Btn>
            </div>
        </div>
        <div>
            <div>
                <h3>Sealed boxes</h3>
                <div v-if="!userBoxesStore.current?.availableBoxes.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                    <p class="font-semibold">You don't have any boxes.</p>
                    <p>Browse the available items in our Genesis collections!</p>
                    <Btn secondary class="mt-2">Browse the themes</Btn>
                </div>
                <div v-else>
                    <BoxListing mode="INVENTORY" :boxes="userBoxesStore.current!.availableBoxes"/>
                </div>
            </div>
            <div>
                <h3>Booklets</h3>
                <div v-if="!userBookletsStore.current?.booklets.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                    <p class="font-semibold">You don't have any booklets.</p>
                    <p>Open one of your boxes or browse the available items in our Genesis collections!</p>
                    <Btn secondary class="mt-2">Browse the themes</Btn>
                </div>
            </div>
            <div>
                <h3>Genesis Sets</h3>
                <div class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                    <p class="font-semibold">You don't have any official Genesis sets.</p>
                    <p>Start working on your booklets or browse the available items in our Genesis collections!</p>
                    <div class="mt-2 flex gap-2">
                        <Btn secondary>Browse the themes</Btn>
                        <RouterLink :to="{ name: 'Builder' }"><Btn>Go to Builder</Btn></RouterLink>
                    </div>
                </div>
            </div>
            <div>
                <h3>Personal creations</h3>
                <div v-if="!creations.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                    <p class="font-semibold">You don't have personal creations.</p>
                    <p>Get some briqs and start building!</p>
                    <Btn secondary class="mt-2">Browse the themes</Btn>
                </div>
                <div v-else class="my-4 grid grid-cols-4 gap-6">
                    <div class="shadow hover:shadow-lg rounded bg-lightest p-4" v-for="creation in creations" :key="creation.id">
                        <div class="bg-grad-light rounded flex justify-center items-center min-h-[4rem] mb-2">Here be preview</div>
                        <h4 class="font-semibold">{{ creation.name }}</h4>
                        <p class="text-xs break-all text-grad-dark flex justify-between">
                            {{ creation.id }}
                            <MenuDropdown no-background no-marker :close-on-click="true" class="w-min p-1 text-sm text-grad-light">
                                <template #button><i class="fas fa-ellipsis-h"/></template>
                                <Btn @click="openSetInBuilder(creation.id)" no-background>Load in builder</Btn>
                                <Btn no-background>(todo) Mint on chain</Btn>
                                <Btn @click="duplicateSet(creation.id)" no-background>Duplicate</Btn>
                                <Btn no-background>(TODO) Download</Btn>
                                <Btn @click="deleteLocalSet(creation.id)" no-background>Delete</Btn>
                            </MenuDropdown>
                        </p>
                        <hr class="my-4">
                        <p class="flex justify-between text-sm">
                            <span class="text-grad-dark">briqs used</span>
                            <span class="font-semibold">{{ creation.getNbBriqs() }}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="container m-auto my-8 grid grid-cols-[3fr_9fr]">
        <div>
            <h2>Shopping Activity</h2>
            <div class="mt-4 flex flex-col gap-2">
                <Btn no-background class="text-left" v-for="section of shoppingSections">{{ section }}</Btn>
            </div>
        </div>
        <div>
            <div>
                <h3>Ongoing Auction Bids</h3>
                <div v-if="!userBidsStore.current?.bids.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                    <p class="font-semibold">You have no bids on ongoing auctions.</p>
                    <p>Browse the available items in our Genesis collections!</p>
                    <Btn secondary class="mt-2">Browse the themes</Btn>
                </div>
            </div>
            <div>
                <h3>Purchased items</h3>
                <div class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                    <p class="font-semibold">You have not yet bought any utem</p>
                    <p>Browse the available items in our Genesis collections!</p>
                    <Btn secondary class="mt-2">Browse the themes</Btn>
                </div>
            </div>
        </div>
    </div>
    <Footer/>
</template>
