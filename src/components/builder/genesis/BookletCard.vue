<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { toRef } from 'vue';
import { useBooklet } from '../BookletComposable';
import GenericCardVue from './GenericCard.vue';

const props = defineProps<{
    boxId: string
}>();

const { getStepImgSrc, bookletData } = useBooklet(undefined, toRef(props, 'boxId'));

const genesisStore = useGenesisStore();

</script>

<template>
    <GenericCardVue :title="bookletData?.name" subtitle="Booklet" :status="!!bookletData ? 'LOADED' : 'ERROR'" :image-src="genesisStore.coverBookletRoute(boxId)">
        <template #content><p>Toto</p></template>
    </GenericCardVue>
</template>
