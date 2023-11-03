<script setup lang="ts">
import { computed } from 'vue';
import MenuDropdown from '../generic/MenuDropdown.vue';
import { useSetHelpers } from '../builder/SetComposable';
import { router } from '@/Routes';
import GenericCard from '../builder/genesis/GenericCard.vue';
import { backendManager } from '@/Backend';
import { pushModal } from '../Modals.vue';
import DownloadSetVue from '../builder/modals/DownloadSet.vue';
import { getCurrentNetwork } from '@/chain/Network';
import { pushPopup } from '@/Notifications';
import { useProfileData, selectedItems, migrateSets } from './ProfileData';

const {
    legacyCreations,
    creations,
    officialCreations,
} = useProfileData();

const {
    disassembleSet,
} = useSetHelpers();

let lastCopy = 0;
const copy = (id: string) => {
    navigator.clipboard.writeText(id);
    if (Date.now() - lastCopy > 500) {
        pushPopup('info', 'Set ID copied', `${ id.slice(0, 7) }...${ id.slice(-3)}`)
        lastCopy = Date.now();
    }
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

.needMigration {
    background: repeating-linear-gradient(
        -50deg,
        rgb(var(--color-primary) / 0.5) 0px,
        rgb(var(--color-primary) / 0.5) 15px,
        rgb(var(--color-grad-lightest)) 15px,
        rgb(var(--color-grad-lightest)) 30px
    ) !important;
    @apply h-7 border border-primary text-text-on-primary font-normal;
}
.needMigration p {
    @apply text-primary bg-grad-lightest px-2 rounded;
}
</style>

<template>
    <div>
        <div v-show="showSection('PERSONAL')">
            <a id="personal" class="relative bottom-[80px]"/>
            <h4>Custom Sets</h4>
            <p class="text-sm mt-1">These are minted NFTs that you have created yourself or got from someone else!</p>
            <div v-if="!(creations.length + legacyCreations.length)" class="bg-grad-lightest rounded-md mt-4 mb-10 p-8 flex flex-col justify-center items-center gap-2">
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
                    :image-src="backendManager.getPreviewUrl(creation.id)"
                    :class="'cursor-pointer' + (mode == 'batch_actions' && selectedItems.has(creation.id) ? ' selected' : '')"
                    :show-pending-marker="creation?.pending"
                    @click=" mode == 'normal' ?
                        router.push({ name: 'UserCreation', params: { network: getCurrentNetwork(), set_id: creation.id }}) :
                        toggleSelected(creation.id)
                    ">
                    <template #subtitle>
                        <Toggle v-if="mode == 'batch_actions'" class="absolute top-4 right-3 w-10" :enabled="selectedItems.has(creation.id)"/>
                        <p class="mx-4 text-grad-dark relative">
                            {{ creation.id.slice(0, 7) }}...{{ creation.id.slice(-3) }}
                            <Btn no-background class="p-0 text-xs" @click.stop="copy(creation.id)"><i class="fa-regular fa-copy"/></Btn>
                            <span v-if="mode == 'normal'" class="absolute bottom-0 right-0">
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
                <GenericCard
                    v-for="creation in legacyCreations" :key="creation.id"
                    :status="creation?.id ? 'LOADED' : 'FETCHING'"
                    :title="creation.name"
                    :image-src="backendManager.getPreviewUrl(creation.id, creation!.network)"
                    :class="'cursor-pointer' + (mode == 'batch_actions' && selectedItems.has(creation.id) ? ' selected' : '')"
                    :show-pending-marker="creation?.pending"
                    @click=" mode == 'normal' ?
                        router.push({ name: 'UserCreation', params: { network: creation?.network, set_id: creation.id }}) :
                        toggleSelected(creation.id)
                    ">
                    <template #subtitle>
                        <div class="needMigration absolute top-0 w-full flex justify-center items-center rounded-t-md">
                            <p>Migration needed</p>
                        </div>
                        <Toggle v-if="mode == 'batch_actions'" class="absolute top-4 right-3 w-10" :enabled="selectedItems.has(creation.id)"/>
                        <p class="mx-4 text-grad-dark relative">
                            {{ creation.id.slice(0, 7) }}...{{ creation.id.slice(-3) }}
                            <Btn no-background class="p-0 text-xs" @click.stop="copy(creation.id)"><i class="fa-regular fa-copy"/></Btn>
                            <span v-if="mode == 'normal'" class="absolute bottom-0 right-0">
                                <MenuDropdown no-background no-marker class="cardContextualMenu !w-6 !h-6 !p-0 text-md">
                                    <template #button><i class="fas fa-ellipsis-h"/></template>
                                    <Btn no-background @click="migrateSets([creation.id])">Migrate</Btn>
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
            <p class="text-sm mt-1">These are minted NFTs from the briq official collection.</p>
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
                    :image-src="backendManager.getPreviewUrl(creation.id)"
                    :class="'cursor-pointer' + (mode == 'batch_actions' && selectedItems.has(creation.id) ? ' selected' : '')"
                    :show-pending-marker="creation?.pending"
                    @click=" mode == 'normal' ?
                        router.push({ name: 'UserCreation', params: { network: getCurrentNetwork(), set_id: creation.id }}) :
                        toggleSelected(creation.id)
                    ">
                    <template #subtitle>
                        <Toggle v-if="mode == 'batch_actions'" class="absolute top-4 right-3 w-10" :enabled="selectedItems.has(creation.id)"/>
                        <p class="mx-4 text-grad-dark relative">
                            {{ creation.id.slice(0, 7) }}...{{ creation.id.slice(-3) }}
                            <Btn no-background class="p-0 text-xs" @click.stop="copy(creation.id)"><i class="fa-regular fa-copy"/></Btn>
                            <span v-if="mode == 'normal'" class="absolute bottom-0 right-0">
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
    </div>
</template>
