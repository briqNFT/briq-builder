<script setup lang="ts">
import Header from '../landing_page/Header.vue';
import Footer from '../landing_page/Footer.vue';

import ProfileIcon from '@/assets/profile/profile.svg?skipsvgo';

import { WEB_WALLET_URL, maybeStore } from '@/chain/WalletLoading';

import GenesisTab from './TabGenesis.vue';
import WipTab from './TabWIP.vue';
import CreationTab from './TabCreation.vue';

import { computed, ref, watch, watchEffect } from 'vue';
import { router } from '@/Routes';
import { useRoute } from 'vue-router';
import { pushModal } from '../Modals.vue';
import NewSetModalVue from '../builder/modals/NewSetModal.vue';
import { getCurrentNetwork, getNetworkName } from '@/chain/Network';
import Tooltip from '../generic/Tooltip.vue';
import { useProfileData, deleteSelected, disassembleSelected, migrateSets, selectedItems, disassemblableItems, migratableItems } from './ProfileData';

const {
    inventoryBoxes,
    inventoryBooklets,
    creationsWIP,
    draftBooklets,
    creations,
    officialCreations,
    legacyCreations,
} = useProfileData();

const userAddress = computed(() => maybeStore.value?.userWalletAddress);

const route = useRoute();

const activeTab = ref('GENESIS' as 'GENESIS' | 'WIP' | 'CREATION');

const filter = ref('ALL');

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
    selectedItems.value.clear();
    mode.value = 'normal';
});

const mode = ref('normal' as 'normal' | 'batch_actions');
</script>

<style scoped>
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
                        <p v-if="maybeStore?.starknetIdDomain" class="font-medium">{{ maybeStore.starknetIdDomain }}</p>
                        <p v-else class="font-medium">{{ userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-3)}` : 'No wallet selected' }}</p>
                        <p class="">
                            {{ getNetworkName(getCurrentNetwork()) }}
                        </p>
                        <p v-if="maybeStore?.isWebWallet()">
                            Manage your Argent Web Wallet <a class="text-primary font-medium" :href="WEB_WALLET_URL" target="_blank">here</a>
                        </p>
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
                <p v-if="userAddress" :class="`font-medium ${activeTab === 'CREATION' ? 'pb-2 border-b-4 border-primary' : 'hover:cursor-pointer text-grad-dark hover:text-grad-darkest'}`" @click="setTab('CREATION')">Minted Sets&nbsp;<span class="pastille">{{ officialCreations.length + creations.length + legacyCreations.length }}</span></p>
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
                        <Btn @click="setSection('ALL')" :force-active="filter === 'ALL'" no-background class="w-full justify-start items-baseline font-medium">All items <span class="pastille">{{ creations.length + officialCreations.length + legacyCreations.length }}</span></Btn>
                        <Btn @click="setSection('PERSONAL')" :force-active="filter === 'PERSONAL'" no-background class="w-full justify-start text-left items-baseline font-medium">Custom Sets<span class="pastille">{{ creations.length + legacyCreations.length }}</span></Btn>
                        <Btn @click="setSection('OFFICIAL')" :force-active="filter === 'OFFICIAL'" no-background class="w-full justify-start items-baseline font-medium">Official Sets<span class="pastille">{{ officialCreations.length }}</span></Btn>
                    </template>
                </div>
                <Btn primary class="w-full text-sm mb-4" @click="pushModal(NewSetModalVue)">New Creation</Btn>
                <Btn v-if="mode == 'normal' && activeTab !== 'GENESIS'" secondary class="w-full text-sm font-normal mb-4" @click="mode = 'batch_actions'">Select for batch actions</Btn>
                <template v-if="mode == 'batch_actions'">
                    <Btn secondary class="w-full text-sm font-normal mb-1" @click="mode = 'normal'">Cancel batch action</Btn>
                    <p class="w-full text-center text-sm font-medium mb-4">{{ selectedItems.size }} selected</p>
                    <Btn v-if="activeTab == 'WIP'" :disabled="selectedItems.size == 0" secondary class="w-full text-sm font-normal mb-1" @click="deleteSelected()">Delete selected</Btn>
                    <Btn v-if="activeTab == 'CREATION'" :disabled="disassemblableItems.length == 0" secondary class="w-full text-sm font-normal mb-1" @click="disassembleSelected()">Disassemble selected</Btn>
                    <Btn v-if="activeTab == 'CREATION'" :disabled="migratableItems.length == 0" secondary class="w-full text-sm font-normal mb-1" @click="migrateSets(Array.from(selectedItems))">Migrate selected</Btn>
                </template>
            </div>
        </div>
        <div>
            <a ref="sectiontop" class="relative top-[-5rem]"/>
            <GenesisTab
                v-if="activeTab === 'GENESIS' && userAddress"
                :filter="filter"/>
            <WipTab
                v-else-if="activeTab === 'WIP'"
                :filter="filter"
                :mode="mode"/>
            <CreationTab
                v-else-if="activeTab === 'CREATION' && userAddress"
                :filter="filter"
                :mode="mode"/>
        </div>
    </div>
    <Footer/>
</template>
