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
import { getCurrentNetwork, getNetworkName } from '@/chain/Network';
import Tooltip from '../generic/Tooltip.vue';
import { pushPopup } from '@/Notifications';
import BoxCard from '../builder/genesis/BoxCard.vue';
import DraftCard from './DraftCard.vue';
import { boxMaterials } from '../builder/genesis/UnboxingGraphicsLight';

const {
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

const inventoryBoxes = computed(() => {
    if (!userBoxesStore?.current?.availableBoxes)
        return [];
    const ret = [] as string[];
    const nb = {} as Record<string, boolean>;
    for (const box of userBoxesStore.current.availableBoxes)
        if (!nb[box]) {
            nb[box] = true;
            ret.push(box);
        }
    return ret;
});


const inventoryBooklets = computed(() => {
    if (!userBookletsStore?.current?.booklets)
        return [];
    const ret = [] as string[];
    const nb = {} as Record<string, boolean>;
    for (const box of userBookletsStore.current.booklets)
        if (!nb[box]) {
            nb[box] = true;
            ret.push(box);
        }
    return ret;
});

const creations = computed(() => {
    return userSetStore.current?.sets.map(setId => {
        if (userSetStore.current?.setData[setId]?.booklet)
            return undefined;
        const data = userSetStore.current?.setData[setId];
        return {
            id: setId,
            name: data?.data?.name || setId,
            nb_briqs: data?.data?.getNbBriqs?.() || 0,
            created_at: data?.created_at || Date.now(),
        }
    }).filter(x => !!x) || [];
})

const creationsWIP = computed(() => {
    return Object.values(setsManager.setsInfo).filter(x => !x.booklet).map(x => x.getSet()) || [];
})

const draftBooklets = computed(() => {
    return Object.values(setsManager.setsInfo).filter(x => x.booklet).map(y => {
        const ret = y.getSet();
        ret.booklet = y.booklet;
        return ret;
    }) || [];
})

const officialCreations = computed(() => {
    return userSetStore.current?.sets.map(setId => {
        if (!userSetStore.current?.setData[setId]?.booklet)
            return undefined;
        const data = userSetStore.current?.setData[setId];
        return {
            id: setId,
            name: data?.data?.name || setId,
            nb_briqs: data?.data?.getNbBriqs?.() || 0,
            created_at: data?.created_at || Date.now(),
        }
    }).filter(x => !!x) || [];
})

const userAddress = computed(() => maybeStore.value?.userWalletAddress);

const route = useRoute();

let lastCopy = 0;
const copy = (id: string) => {
    navigator.clipboard.writeText(id);
    if (Date.now() - lastCopy > 500) {
        pushPopup('info', 'Set ID copied')
        lastCopy = Date.now();
    }
}
const activeTab = ref('GENESIS' as 'GENESIS' | 'WIP' | 'CREATION' | 'ACTIVITY');

const filter = ref('ALL');
const showSection = (section: string) => {
    return filter.value === 'ALL' || filter.value === section;
}

const sectiontop = ref(null as unknown as HTMLElement);

const setSection = (section: string) => {
    filter.value = section;
    if (sectiontop.value.getBoundingClientRect().y < 0)
        sectiontop.value.scrollIntoView(true);
}

const setTab = (tab: string) => {
    setSection('ALL');
    activeTab.value = tab;
}

watchEffect(() => {
    if (route.query['tab'])
        activeTab.value = route.query['tab'];
})

watchEffect(() => {
    if (maybeStore.value && !userAddress.value && activeTab.value === 'GENESIS')
        activeTab.value = 'WIP';
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

.item-card ::v-deep(.cardContextualMenu) {
    @apply invisible;
}

.item-card:hover ::v-deep(.cardContextualMenu) {
    @apply visible;
}

.pastille {
    @apply font-medium text-xs;
}
button .pastille {
    @apply ml-1 text-grad-dark;
}
div[data-name='menu'] button {
    @apply text-sm font-normal justify-start;
}
</style>

<template>
    <Header class="!bg-grad-lightest !mb-0"/>
    <div class="bg-grad-lightest border-b border-grad-light">
        <div class="container m-auto pt-6 flex-col justify-between">
            <div class="flex gap-0 pb-8">
                <Tooltip tooltip="Sorry, you can't (yet) change your profile picture...">
                    <div class="bg-grad-lighter rounded border border-grad-light w-[7.75rem] h-[7.75rem]"><ProfileIcon width="100%" height="100%"/></div>
                </Tooltip>
                <div class="p-4 flex flex-col gap-2">
                    <h5 class="font-normal text-grad-dark">Account</h5>
                    <template v-if="userAddress">
                        <p class="block lg:hidden font-medium">{{ userAddress ? `${userAddress.slice(0, 5)}...${userAddress.slice(-3)}` : 'No wallet selected' }}</p>
                        <p class="hidden lg:block font-medium">{{ userAddress ? `${userAddress.slice(0, 9)}...${userAddress.slice(-7)}` : 'No wallet selected' }}</p>
                        <p class="">{{ getNetworkName(getCurrentNetwork()) }}</p>
                    </template>
                    <p v-else class="my-4">Connect your wallet to access more functionality.</p>
                </div>
            </div>
            <!--
            <div class="p-4 rounded-md border border-grad-light">
                <h4 class="font-medium">My briqs</h4>
                <p class="my-4"><span class="font-medium">Available briqs:</span> {{ chainBriqs?.getNbBriqs() || 0 }}</p>
            </div>
            -->
            <div class="flex gap-8">
                <p v-if="userAddress" :class="`font-medium ${activeTab === 'GENESIS' ? 'pb-2 border-b-4 border-primary' : 'hover:cursor-pointer text-grad-dark hover:text-grad-darkest'}`" @click="setTab('GENESIS')">Boxes & Booklets&nbsp;<span class="pastille">{{ inventoryBoxes.length + inventoryBooklets.length }}</span></p>
                <p :class="`font-medium ${activeTab === 'WIP' ? 'pb-2 border-b-4 border-primary' : 'hover:cursor-pointer text-grad-dark hover:text-grad-darkest'}`" @click="setTab('WIP')">Work in Progress&nbsp;<span class="pastille">{{ creationsWIP.length + draftBooklets.length }}</span></p>
                <p :class="`font-medium ${activeTab === 'CREATION' ? 'pb-2 border-b-4 border-primary' : 'hover:cursor-pointer text-grad-dark hover:text-grad-darkest'}`" @click="setTab('CREATION')">Minted Sets&nbsp;<span class="pastille">{{ officialCreations.length + creations.length }}</span></p>
                <!--<p v-if="userAddress" :class="`font-medium ${activeTab === 'ACTIVITY' ? 'pb-2 border-b-4 border-primary' : 'hover:cursor-pointer text-grad-dark hover:text-grad-darkest'}`" @click="setTab('ACTIVITY')">Shopping Activity</p>-->
            </div>
        </div>
    </div>
    <div class="container m-auto my-6 md:grid md:grid-cols-[3fr_9fr] gap-8 min-h-[70vh]">
        <div>
            <div class="sticky top-[80px]">
                <div v-if="userAddress" class="bg-grad-lightest rounded flex flex-col p-2 gap-2 mb-4">
                    <template v-if="activeTab === 'GENESIS'">
                        <Btn @click="setSection('ALL')" :force-active="filter === 'ALL'" no-background class="w-full justify-start items-baseline font-medium">All items <span class="pastille">{{ inventoryBoxes.length + inventoryBooklets.length }}</span></Btn>
                        <Btn @click="setSection('BOX')" :force-active="filter === 'BOX'" no-background class="w-full justify-start items-baseline font-medium">Boxes <span class="pastille">{{ inventoryBoxes.length }}</span></Btn>
                        <Btn @click="setSection('BOOKLET')" :force-active="filter === 'BOOKLET'" no-background class="w-full justify-start text-left items-center font-medium">Booklets <span class="pastille">{{ inventoryBooklets.length }}</span></Btn>
                    </template>
                    <template v-else-if="activeTab === 'WIP'">
                        <Btn @click="setSection('ALL')" :force-active="filter === 'ALL'" no-background class="w-full justify-start items-baseline font-medium">All items <span class="pastille">{{ draftBooklets.length + creationsWIP.length }}</span></Btn>
                        <Btn @click="setSection('PERSONAL')" :force-active="filter === 'PERSONAL'" no-background class="w-full justify-start text-left items-center font-medium">Custom Sets<span class="pastille">{{ creationsWIP.length }}</span></Btn>
                        <Btn @click="setSection('OFFICIAL')" :force-active="filter === 'OFFICIAL'" no-background class="w-full justify-start items-baseline font-medium">Official Sets<span class="pastille">{{ draftBooklets.length }}</span></Btn>
                    </template>
                    <template v-else-if="activeTab === 'CREATION'">
                        <Btn @click="setSection('ALL')" :force-active="filter === 'ALL'" no-background class="w-full justify-start items-baseline font-medium">All items <span class="pastille">{{ creations.length + officialCreations.length }}</span></Btn>
                        <Btn @click="setSection('PERSONAL')" :force-active="filter === 'PERSONAL'" no-background class="w-full justify-start text-left items-baseline font-medium">Custom Sets<span class="pastille">{{ creations.length }}</span></Btn>
                        <Btn @click="setSection('OFFICIAL')" :force-active="filter === 'OFFICIAL'" no-background class="w-full justify-start items-baseline font-medium">Official Sets<span class="pastille">{{ officialCreations.length }}</span></Btn>
                    </template>
                    <template v-else-if="activeTab === 'ACTIVITY'">
                        <Btn @click="setSection('ALL')" :force-active="filter === 'ALL'" no-background class="w-full justify-start text-left items-baseline font-medium">All items <span class="pastille">{{ winningBids.length + losingBids.length }}</span></Btn>
                        <Btn @click="setSection('WINNING')" :force-active="filter === 'WINNING'" no-background class="w-full justify-start text-left items-baseline font-medium">Winning bids <span class="pastille">{{ winningBids.length }}</span></Btn>
                        <Btn @click="setSection('LOSING')" :force-active="filter === 'LOSING'" no-background class="w-full justify-start text-left items-baseline font-medium">Losing bids <span class="pastille">{{ losingBids.length }}</span></Btn>
                        <Btn @click="setSection('PURCHASED')" :force-active="filter === 'PURCHASED'" no-background class="w-full justify-start text-left items-baseline font-medium">Purchased items <span class="pastille">{{ 0 }}</span></Btn>
                    </template>
                </div>
                <Btn primary class="w-full text-sm mb-4" @click="pushModal(NewSetModalVue)">New Creation</Btn>
            </div>
        </div>
        <div>
            <a ref="sectiontop" class="relative top-[-5rem]"/>
            <div v-if="activeTab === 'GENESIS' && userAddress">
                <div v-show="showSection('BOX')">
                    <a id="box" class="relative bottom-[80px]"/>
                    <h4>Boxes</h4>
                    <p class="text-sm mt-1">Boxes contain briqs and an instruction booklet. Unbox them to get their content and start building!</p>
                    <div v-if="!inventoryBoxes.length" class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">You don't have any boxes.</p>
                        <p>Browse the available items in our Genesis collections!</p>
                        <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-10 z-50">
                        <RouterLink :to="`box/${token_id}`" v-for="token_id, i of inventoryBoxes" :key="`${token_id}_${i}`">
                            <BoxCard mode="INVENTORY" :token-name="token_id"/>
                        </routerlink>
                    </div>
                </div>
                <div v-show="showSection('BOOKLET')">
                    <a id="booklet" class="relative bottom-[80px]"/>
                    <h4>Booklets</h4>
                    <p class="text-sm mt-1">Booklets contain instructions to build official briq sets. Follow the instructions to mint the official sets!</p>
                    <div v-if="!inventoryBooklets.length" class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">You don't have any booklets.</p>
                        <p>Open one of your boxes or browse the available items in our Genesis collections!</p>
                        <Btn secondary class="mt-2">Browse the themes</Btn>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-10 z-50">
                        <div v-for="booklet of inventoryBooklets" :key="booklet">
                            <RouterLink :to="`booklet/${booklet}`">
                                <BookletCard :box-id="booklet"/>
                            </RouterLink>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else-if="activeTab === 'WIP'">
                <div v-show="showSection('PERSONAL')">
                    <a id="personal" class="relative bottom-[80px]"/>
                    <h4>Custom Sets</h4>
                    <p class="text-sm mt-1">Work in progress sets are stored on this computer only and shared across wallets.</p>
                    <div v-if="!creationsWIP.length" class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">You don't have work-in-progress sets.</p>
                        <p>Get some briqs and start building!</p>
                        <div class="flex gap-2 mt-2">
                            <router-link :to="{ name: 'ThemesListing' }"><Btn secondary>Browse the themes</Btn></router-link>
                            <RouterLink :to="{ name: 'Builder' }"><Btn>Start a new work</Btn></RouterLink>
                        </div>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-10 z-50">
                        <GenericCard
                            v-for="creation in creationsWIP" :key="creation.id"
                            :status="creation?.id ? 'LOADED' : 'FETCHING'"
                            :title="creation.name"
                            :image-src="getPreview(creation.id)"
                            image-bg="bg-background"
                            class="cursor-pointer"
                            @click="openSetInBuilder(creation.id)">
                            <template #subtitle>
                                <p class="mx-4 text-grad-dark relative">
                                    WIP
                                    <span class="absolute bottom-0 right-0">
                                        <MenuDropdown no-background no-marker class="cardContextualMenu !w-6 !h-6 !p-0 text-md">
                                            <template #button><i class="fas fa-ellipsis-h"/></template>
                                            <Btn @click="duplicateSet(creation)" no-background>Duplicate</Btn>
                                            <Btn @click="downloadSet(creation)" no-background>Download</Btn>
                                            <Btn @click="deleteLocalSet(creation.id)" no-background>Delete</Btn>
                                        </MenuDropdown>
                                    </span>
                                </p>
                            </template>
                            <template #content>
                                <p class="flex justify-between text-sm">
                                    <span class="text-grad-dark">briqs needed</span>
                                    <span class="font-medium">{{ creation.getNbBriqs() }}</span>
                                </p>
                                <p class="flex justify-between text-sm">
                                    <span class="text-grad-dark">Last updated on</span>
                                    <span class="">{{ new Date(setsManager.getInfo(creation.id)!.lastUpdate).toLocaleString("en-uk", { dateStyle: "medium" }) }}</span>
                                </p>
                            </template>
                        </GenericCard>
                    </div>
                </div>
                <div v-show="showSection('OFFICIAL')">
                    <a id="official" class="relative bottom-[80px]"/>
                    <h4>Official Sets</h4>
                    <p class="text-sm mt-1">You can only have one WIP for each Booklet type. Like Custom Sets, these are stored locally on your computer.</p>
                    <div v-if="!userBookletsStore.current?.booklets.length" class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">You don't have any work-in-progress official sets.</p>
                        <p>Open one of your boxes or browse the available items in our Genesis collections!</p>
                        <Btn secondary class="mt-2">Browse the themes</Btn>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-10 z-50">
                        <DraftCard :creation="creation" v-for="creation of draftBooklets" :key="creation.id"/>
                    </div>
                </div>
            </div>
            <div v-else-if="activeTab === 'CREATION' && userAddress">
                <div v-show="showSection('PERSONAL')">
                    <a id="personal" class="relative bottom-[80px]"/>
                    <h4>Custom Sets</h4>
                    <div v-if="!creations.length" class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">
                            You have not yet created a set yourself. <br> Let your imagination run free!
                        </p><p>Get some briqs and start building!</p>
                        <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-10 z-50">
                        <GenericCard
                            v-for="creation in creations" :key="creation.id"
                            :status="creation?.id ? 'LOADED' : 'FETCHING'"
                            :title="creation.name"
                            :image-src="backendManager.getPreviewUrl(creation.id).replace('.png', '.jpg')"
                            class="cursor-pointer"
                            @click="router.push({ name: 'UserCreation', params: { network: getCurrentNetwork(), set_id: creation.id }})">
                            <template #subtitle>
                                <p class="mx-4 text-grad-dark relative">
                                    {{ creation.id.slice(0, 7) }}...{{ creation.id.slice(-2) }}
                                    <Btn no-background class="p-0 text-xs" @click.stop="copy(creation.id)"><i class="fa-regular fa-copy"/></Btn>
                                    <span class="absolute bottom-0 right-0">
                                        <MenuDropdown no-background no-marker class="cardContextualMenu !w-6 !h-6 !p-0 text-md">
                                            <template #button><i class="fas fa-ellipsis-h"/></template>
                                            <Btn no-background @click="disassembleSet(creation.id)">Disassemble</Btn>
                                            <Btn no-background @click="pushModal(DownloadSetVue, { setId: creation.id })">Download</Btn>
                                        </MenuDropdown>
                                    </span>
                                </p>
                            </template>
                            <template #content>
                                <p class="flex justify-between text-sm">
                                    <span class="text-grad-dark">briqs used</span>
                                    <span class="font-medium">{{ creation.nb_briqs }}</span>
                                </p>
                                <p class="flex justify-between text-sm">
                                    <span class="text-grad-dark">Minted on</span>
                                    <span class="font-normal">{{ new Date(creation.created_at).toLocaleString("en-uk", { dateStyle: "medium" }) }}</span>
                                </p>
                            </template>
                        </GenericCard>
                    </div>
                </div>
                <div v-show="showSection('OFFICIAL')">
                    <a id="official" class="relative bottom-[80px]"/>
                    <h4>Official Sets</h4>
                    <div v-if="!officialCreations.length" class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
                        <p class="font-semibold">You don't have any official Genesis sets.</p>
                        <p>Start working on your booklets or browse the available items in our Genesis collections!</p>
                        <div class="mt-2 flex gap-2">
                            <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                        </div>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-10 z-50">
                        <GenericCard
                            v-for="creation in officialCreations" :key="creation.id"
                            :status="creation?.id ? 'LOADED' : 'FETCHING'"
                            :title="creation.name"
                            :image-src="backendManager.getPreviewUrl(creation.id).replace('.png', '.jpg')"
                            class="cursor-pointer"
                            @click="router.push({ name: 'UserCreation', params: { network: getCurrentNetwork(), set_id: creation.id }})">
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
                                    <span class="font-medium">{{ creation.nb_briqs }}</span>
                                </p>
                                <p class="flex justify-between text-sm">
                                    <span class="text-grad-dark">Minted on</span>
                                    <span class="font-normal">{{ new Date(creation.created_at).toLocaleString("en-uk", { dateStyle: "medium" }) }}</span>
                                </p>
                            </template>
                        </GenericCard>
                    </div>
                </div>
            </div>
            <div v-else-if="activeTab === 'ACTIVITY' && userAddress">
                <div>
                    <div v-show="showSection('WINNING')">
                        <a id="winning" class="relative bottom-[80px]"/>
                        <h4>Winning bids on ongoing auctions</h4>
                        <div v-if="!winningBids.length" class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
                            <p class="font-semibold">You have no winning bids on ongoing auctions.</p>
                            <p>Browse the available items in our Genesis collections!</p>
                            <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                        </div>
                        <div v-else>
                            <BoxListing :boxes="winningBids" :mode="'BID'"/>
                        </div>
                    </div>
                    <div v-show="showSection('LOSING')">
                        <a id="losing" class="relative bottom-[80px]"/>
                        <h4>Losing bids on ongoing auctions</h4>
                        <div v-if="!losingBids.length" class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
                            <p class="font-semibold">No losing bids to report.</p>
                            <p>Browse the available items in our Genesis collections!</p>
                            <router-link :to="{ name: 'ThemesListing' }"><Btn secondary class="mt-2">Browse the themes</Btn></router-link>
                        </div>
                        <div v-else>
                            <BoxListing :boxes="losingBids" :mode="'BID'"/>
                        </div>
                    </div>
                    <div v-show="showSection('PURCHASED')">
                        <a id="purchased" class="relative bottom-[80px]"/>
                        <h4>Purchased items</h4>
                        <div class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
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
