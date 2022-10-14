<script setup lang="ts">
import Header from '../landing_page/Header.vue';
import Footer from '../landing_page/Footer.vue';

import ProfileIcon from '@/assets/profile/profile.svg?skipsvgo';

import { maybeStore } from '@/chain/WalletLoading';

import { computed, ref, watch, watchEffect } from 'vue';
import { userBoxesStore } from '@/builder/UserBoxes';
import { userBookletsStore } from '@/builder/UserBooklets';
import { userSetStore } from '@/builder/UserSets';
import { userBidsStore, productBidsStore, Bid } from '@/builder/BidStore';
import BoxListing from '../builder/genesis/BoxListing.vue';
import { setsManager } from '@/builder/SetsManager';
import MenuDropdown from '../generic/MenuDropdown.vue';
import { useSetHelpers } from '../builder/SetComposable';
import { router } from '@/Routes';
import BookletCard from '../builder/genesis/BookletCard.vue';
import GenericCard from '../builder/genesis/GenericCard.vue';
import { backendManager } from '@/Backend';
import { useRoute } from 'vue-router';
import { pushModal } from '../Modals.vue';
import NewSetModalVue from '../builder/modals/NewSetModal.vue';
import DownloadSetVue from '../builder/modals/DownloadSet.vue';

const {
    createNewSet,
    openSetInBuilder,
    duplicateSet,
    deleteLocalSet,
    disassembleSet,
    downloadSet,
} = useSetHelpers();

const getPreview = (id: string) => {
    return window.localStorage.getItem('set_preview_' + id);
}

const bids = computed(() => {
    const bids = {} as { [key: string]: Bid }
    for (const bid of userBidsStore.current?.bids ?? [])
        if (!(bid.bid_id in bids))
            bids[bid.box_id] = bid;
        else if (bids[bid.box_id])
            bids[bid.box_id] = bid;
    return Object.values(bids);
});

const winningBids = computed(() => {
    const boxes = [];
    for (let bid of bids.value)
        if (productBidsStore.bids(bid.box_id).highest_bid === bid.bid_id)
            boxes.push(bid.box_id);
    return boxes;
})

const losingBids = computed(() => {
    const boxes = [];
    for (let bid of bids.value)
        if (productBidsStore.bids(bid.box_id).highest_bid !== bid.bid_id)
            boxes.push(bid.box_id);
    return boxes;
})

const creations = computed(() => {
    return userSetStore.current?.sets.map(setId => {
        if (userSetStore.current?.setData[setId]?.booklet)
            return undefined;
        const data = userSetStore.current?.setData[setId]?.data;
        return {
            id: setId,
            name: data?.name || setId,
            nb_briqs: data?.getNbBriqs?.() || 0,
        }
    }).filter(x => !!x) || [];
})

const creationsWIP = computed(() => {
    return Object.values(setsManager.setsInfo).filter(x => !x.booklet).map(x => x.getSet());
})

const officialCreations = computed(() => {
    return userSetStore.current?.sets.map(setId => {
        if (!userSetStore.current?.setData[setId]?.booklet)
            return undefined;
        const data = userSetStore.current?.setData[setId]?.data;
        return {
            id: setId,
            name: data?.name || setId,
            nb_briqs: data?.getNbBriqs?.() || 0,
        }
    }).filter(x => !!x) || [];
})

const userAddress = computed(() => maybeStore.value?.userWalletAddress);

const route = useRoute();

const activeTab = ref('CREATION' as 'CREATION' | 'GENESIS' | 'ACTIVITY');

watchEffect(() => {
    if (route.query['tab'])
        activeTab.value = route.query['tab'];
})

watchEffect(() => {
    if (maybeStore.value && !userAddress.value && activeTab.value !== 'CREATION')
        activeTab.value = 'CREATION';
})

watch([activeTab], () => {
    router.replace({ query: { tab: activeTab.value } })
});

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

.card:hover ::v-deep(.cardContextualMenu) {
    @apply !text-grad-darker;
}
</style>

<template>
    <Header class="bg-grad-lightest mb-0"/>
    <div class="bg-grad-lightest border-b border-grad-light">
        <div class="container m-auto pt-6 flex-col justify-between">
            <div class="flex gap-4 pb-8">
                <div class="bg-grad-lighter rounded border border-grad-light w-[7.75rem] h-[7.75rem]"><ProfileIcon width="100%" height="100%"/></div>
                <div>
                    <h5 class="font-normal text-grad-dark">Account</h5>
                    <p class="block lg:hidden font-medium">{{ userAddress ? `${userAddress.slice(0, 5)}...${userAddress.slice(-3)}` : 'No wallet selected' }}</p>
                    <p class="hidden lg:block font-medium">{{ userAddress ? `${userAddress.slice(0, 9)}...${userAddress.slice(-7)}` : 'No wallet selected' }}</p>
                    <p v-if="!userAddress" class="my-4">Connect your wallet to access more functionality.</p>
                </div>
            </div>
            <!--
            <div class="p-4 rounded-md border border-grad-light">
                <h4 class="font-medium">My briqs</h4>
                <p class="my-4"><span class="font-medium">Available briqs:</span> {{ chainBriqs?.getNbBriqs() || 0 }}</p>
            </div>
            -->
            <div class="flex gap-8">
                <p :class="`font-medium ${activeTab === 'CREATION' ? 'pb-4 border-b-4 border-primary' : 'hover:cursor-pointer text-grad-dark hover:text-grad-darkest'}`" @click="activeTab = 'CREATION'">My creations</p>
                <p v-if="userAddress" :class="`font-medium ${activeTab === 'GENESIS' ? 'pb-4 border-b-4 border-primary' : 'hover:cursor-pointer text-grad-dark hover:text-grad-darkest'}`" @click="activeTab = 'GENESIS'">Genesis collection</p>
                <p v-if="userAddress" :class="`font-medium ${activeTab === 'ACTIVITY' ? 'pb-4 border-b-4 border-primary' : 'hover:cursor-pointer text-grad-dark hover:text-grad-darkest'}`" @click="activeTab = 'ACTIVITY'">Shopping Activity</p>
            </div>
        </div>
    </div>
    <div class="container m-auto my-8 grid grid-cols-[3fr_9fr] gap-8">
        <div>
            <div class="sticky top-[80px]">
                <div v-if="userAddress" class="bg-grad-lightest rounded flex flex-col p-2 gap-2 mb-4">
                    <template v-if="activeTab === 'CREATION'">
                        <RouterLink class="w-full" to="#wip"><Btn no-background class="w-full justify-start font-medium">Work in Progress</Btn></RouterLink>
                        <RouterLink class="w-full" to="#minted"><Btn no-background class="w-full justify-start font-medium">Minted</Btn></RouterLink>
                    </template>
                    <template v-else-if="activeTab === 'GENESIS'">
                        <RouterLink class="w-full" to="#box"><Btn no-background class="w-full justify-start font-medium">Sealed Boxes</Btn></RouterLink>
                        <RouterLink class="w-full" to="#booklet"><Btn no-background class="w-full justify-start font-medium">Unbuilt Booklets</Btn></RouterLink>
                        <RouterLink class="w-full" to="#minted"><Btn no-background class="w-full justify-start font-medium">Official Sets</Btn></RouterLink>
                    </template>
                    <template v-else-if="activeTab === 'ACTIVITY'">
                        <RouterLink class="w-full" to="#winning"><Btn no-background class="w-full justify-start font-medium">Winning Bids</Btn></RouterLink>
                        <RouterLink class="w-full" to="#losing"><Btn no-background class="w-full justify-start font-medium">Losing Bids</Btn></RouterLink>
                        <RouterLink class="w-full" to="#purchased"><Btn no-background class="w-full justify-start font-medium">Purchased Items</Btn></RouterLink>
                    </template>
                </div>
                <Btn primary class="w-full text-sm" @click="pushModal(NewSetModalVue)">New Creation</Btn>
            </div>
        </div>
        <div>
            <div v-if="activeTab === 'CREATION'">
                <div>
                    <a id="wip" class="relative bottom-[80px]"/>
                    <h3>Work in progress</h3>
                    <p>WIP sets are stored on this computer only and shared across wallets.</p>
                    <div v-if="!creationsWIP.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">You don't have work-in-progress sets.</p>
                        <p>Get some briqs and start building!</p>
                        <div class="flex gap-2 mt-2">
                            <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                            <RouterLink :to="{ name: 'Builder' }"><Btn>Start a new work</Btn></RouterLink>
                        </div>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-8 z-50">
                        <GenericCard
                            v-for="creation in creationsWIP" :key="creation.id"
                            :status="creation?.id ? 'LOADED' : 'FETCHING'"
                            :title="creation.name"
                            :image-src="getPreview(creation.id)"
                            image-bg="bg-background"
                            class="cursor-pointer"
                            @click="openSetInBuilder(creation.id)">
                            <template #subtitle>
                                <p class="px-4 text-xs break-all text-grad-dark flex justify-between">
                                    {{ creation.id }}
                                    <MenuDropdown no-background no-marker class="cardContextualMenu w-min p-1 text-sm text-grad-light">
                                        <template #button><i class="fas fa-ellipsis-h"/></template>
                                        <Btn @click="duplicateSet(creation)" no-background>Duplicate</Btn>
                                        <Btn @click="downloadSet(creation)" no-background>Download</Btn>
                                        <Btn @click="deleteLocalSet(creation.id)" no-background>Delete</Btn>
                                    </MenuDropdown>
                                </p>
                            </template>
                            <template #content>
                                <p class="flex justify-between text-sm">
                                    <span class="text-grad-dark">briqs needed</span>
                                    <span class="font-semibold">{{ creation.getNbBriqs() }}</span>
                                </p>
                            </template>
                        </GenericCard>
                    </div>
                </div>
                <template v-if="userAddress">
                    <a id="minted" class="relative bottom-[80px]"/>
                    <h3>Minted</h3>
                    <div v-if="!creations.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">You don't have personal creations.</p>
                        <p>Get some briqs and start building!</p>
                        <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-8 z-50">
                        <GenericCard
                            v-for="creation in creations" :key="creation.id"
                            :status="creation?.id ? 'LOADED' : 'FETCHING'"
                            :title="creation.name"
                            :image-src="backendManager.getPreviewUrl(creation.id)"
                            class="cursor-pointer"
                            @click="router.push({ name: 'UserCreation', params: { set_id: creation.id }})">
                            <template #subtitle>
                                <p class="px-4 text-xs break-all text-grad-dark flex justify-between">
                                    {{ creation.id }}
                                    <MenuDropdown no-background no-marker class="cardContextualMenu w-min p-1 text-sm text-grad-light">
                                        <template #button><i class="fas fa-ellipsis-h"/></template>
                                        <Btn no-background @click="disassembleSet(creation.id)">Disassemble</Btn>
                                        <Btn no-background @click="pushModal(DownloadSetVue, { setId: creation.id })">Download</Btn>
                                    </MenuDropdown>
                                </p>
                            </template>
                            <template #content>
                                <p class="flex justify-between text-sm">
                                    <span class="text-grad-dark">briqs used</span>
                                    <span class="font-semibold">{{ creation.nb_briqs }}</span>
                                </p>
                            </template>
                        </GenericCard>
                    </div>
                </template>
            </div>
            <div v-else-if="activeTab === 'GENESIS' && userAddress">
                <div>
                    <a id="box" class="relative bottom-[80px]"/>
                    <h3>Sealed boxes</h3>
                    <div v-if="!userBoxesStore.current?.availableBoxes.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">You don't have any boxes.</p>
                        <p>Browse the available items in our Genesis collections!</p>
                        <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                    </div>
                    <div v-else>
                        <BoxListing mode="INVENTORY" :boxes="userBoxesStore.current!.availableBoxes"/>
                    </div>
                </div>
                <div>
                    <a id="booklet" class="relative bottom-[80px]"/>
                    <h3>Unbuilt Booklets</h3>
                    <div v-if="!userBookletsStore.current?.booklets.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">You don't have any booklets.</p>
                        <p>Open one of your boxes or browse the available items in our Genesis collections!</p>
                        <Btn secondary class="mt-2">Browse the themes</Btn>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-8 z-50">
                        <div v-for="booklet of userBookletsStore.current?.booklets">
                            <RouterLink :to="`user/booklet/${booklet}`">
                                <BookletCard :box-id="booklet"/>
                            </RouterLink>
                        </div>
                    </div>
                </div>
                <div>
                    <a id="minted" class="relative bottom-[80px]"/>
                    <h3>Official Sets</h3>
                    <div v-if="!officialCreations.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">You don't have any official Genesis sets.</p>
                        <p>Start working on your booklets or browse the available items in our Genesis collections!</p>
                        <div class="mt-2 flex gap-2">
                            <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                        </div>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-8 z-50">
                        <GenericCard
                            v-for="creation in officialCreations" :key="creation.id"
                            :status="creation?.id ? 'LOADED' : 'FETCHING'"
                            :title="creation.name"
                            :image-src="backendManager.getPreviewUrl(creation.id)"
                            class="cursor-pointer"
                            @click="router.push({ name: 'UserCreation', params: { set_id: creation.id }})">
                            <template #subtitle>
                                <p class="px-4 text-xs break-all text-grad-dark flex justify-between">
                                    {{ creation.id }}
                                    <MenuDropdown no-background no-marker class="cardContextualMenu w-min p-1 text-sm text-grad-light">
                                        <template #button><i class="fas fa-ellipsis-h"/></template>
                                        <Btn no-background @click="disassembleSet(creation.id)">Disassemble</Btn>
                                        <Btn no-background @click="pushModal(DownloadSetVue, { setId: creation.id })">Download</Btn>
                                    </MenuDropdown>
                                </p>
                            </template>
                            <template #content>
                                <p class="flex justify-between text-sm">
                                    <span class="text-grad-dark">briqs used</span>
                                    <span class="font-semibold">{{ creation.nb_briqs }}</span>
                                </p>
                            </template>
                        </GenericCard>
                    </div>
                </div>
            </div>
            <div v-else-if="activeTab === 'ACTIVITY' && userAddress">
                <div>
                    <div>
                        <a id="winning" class="relative bottom-[80px]"/>
                        <h3>Winning bids on ongoing auctions</h3>
                        <div v-if="!winningBids.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                            <p class="font-semibold">You have no winning bids on ongoing auctions.</p>
                            <p>Browse the available items in our Genesis collections!</p>
                            <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                        </div>
                        <div v-else>
                            <BoxListing :boxes="winningBids" :mode="'BID'"/>
                        </div>
                    </div>
                    <div>
                        <a id="losing" class="relative bottom-[80px]"/>
                        <h3>Losing bids on ongoing auctions</h3>
                        <div v-if="!losingBids.length" class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                            <p class="font-semibold">No losing bids to report.</p>
                            <p>Browse the available items in our Genesis collections!</p>
                            <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                        </div>
                        <div v-else>
                            <BoxListing :boxes="losingBids" :mode="'BID'"/>
                        </div>
                    </div>
                    <div>
                        <a id="purchased" class="relative bottom-[80px]"/>
                        <h3>Purchased items</h3>
                        <div class="bg-grad-lightest rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                            <p class="font-semibold">You have not yet bought any item</p>
                            <p>Browse the available items in our Genesis collections!</p>
                            <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <Footer/>
</template>
