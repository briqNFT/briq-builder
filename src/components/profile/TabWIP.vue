<script setup lang="ts">
import { computed } from 'vue';
import { setsManager } from '@/builder/SetsManager';
import MenuDropdown from '../generic/MenuDropdown.vue';
import { useSetHelpers } from '../builder/SetComposable';
import GenericCard from '../builder/genesis/GenericCard.vue';
import DraftCard from './DraftCard.vue';

import { useProfileData, selectedItems } from './ProfileData';

const {
    creationsWIP,
    draftBooklets,
} = useProfileData();

const {
    openSetInBuilder,
    duplicateSet,
    deleteLocalSet,
    downloadSet,
} = useSetHelpers();

const getPreview = (id: string) => {
    return window.localStorage.getItem('set_preview_' + id);
}

const props = defineProps({
    filter: {
        type: String,
        default: 'ALL',
    },
    mode: {
        type: String,
        default: 'normal' as 'normal' | 'batch_actions',
    },
});

const filter = computed(() => props.filter);
const showSection = (section: string) => {
    return filter.value === 'ALL' || filter.value === section;
}

const mode = computed(() => props.mode)
const toggleSelected = (id: string) => {
    if (selectedItems.value.has(id))
        selectedItems.value.delete(id);
    else
        selectedItems.value.add(id);
}
</script>

<style scoped>
@media (hover: hover) {
    .item-card ::v-deep(.cardContextualMenu) {
        @apply invisible;
    }
    .item-card:hover ::v-deep(.cardContextualMenu) {
        @apply visible;
    }
}
::v-deep(.item-card.selected) > div {
    @apply ring-2 ring-primary;
}
</style>

<template>
    <div>
        <div v-show="showSection('PERSONAL')">
            <a id="personal" class="relative bottom-[80px]"/>
            <h4>Custom Sets</h4>
            <p class="text-sm mt-1">Sets you have started but haven't minted yet. They are stored locally on this computer only.</p>
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
                    :class="'cursor-pointer' + (mode == 'batch_actions' && selectedItems.has(creation.id) ? ' selected' : '')"
                    @click="mode == 'normal' ? openSetInBuilder(creation.id) : toggleSelected(creation.id)">
                    <template #subtitle>
                        <Toggle v-if="mode == 'batch_actions'" class="absolute top-4 right-3 w-10" :enabled="selectedItems.has(creation.id)"/>
                        <p class="mx-4 text-grad-dark relative">
                            WIP
                            <span v-if="mode == 'normal'" class="absolute bottom-0 right-0">
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
            <div v-if="!draftBooklets.length" class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
                <p class="font-semibold">You don't have any work-in-progress official sets.</p>
                <p>Open one of your boxes or browse the available items in our Genesis collections!</p>
                <Btn secondary class="mt-2">Browse the themes</Btn>
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-10 z-50">
                <template v-if="mode == 'normal'">
                    <DraftCard :creation="creation" v-for="creation of draftBooklets" :key="creation.id"/>
                </template>
                <template v-else>
                    <DraftCard @click.capture="toggleSelected(creation.id)" :creation="creation" v-for="creation of draftBooklets" :key="creation.id"/>
                </template>
            </div>
        </div>
    </div>
</template>
