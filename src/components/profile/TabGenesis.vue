<script setup lang="ts">
import { computed } from 'vue';
import BookletCard from '../builder/genesis/BookletCard.vue';
import BoxCard from '../builder/genesis/BoxCard.vue';

import { useProfileData } from './ProfileData';

const {
    inventoryBoxes,
    inventoryBooklets,
} = useProfileData();

const props = defineProps({
    filter: {
        type: String,
        default: 'ALL',
    },
});

const filter = computed(() => props.filter);
const showSection = (section: string) => {
    return filter.value === 'ALL' || filter.value === section;
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
</style>

<template>
    <div>
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
                <div v-if="mode == 'normal'">
                    <RouterLink :to="`box/${token_id.split('/').map(encodeURIComponent).join('/')}`" v-for="token_id, i of inventoryBoxes" :key="`${token_id}_${i}`">
                        <BoxCard mode="INVENTORY" :token-name="token_id"/>
                    </routerlink>
                </div>
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
                    <RouterLink :to="`booklet/${booklet.split('/').map(encodeURIComponent).join('/')}`">
                        <BookletCard :box-id="booklet"/>
                    </RouterLink>
                </div>
            </div>
        </div>
    </div>
</template>
