<script setup lang="ts">
import { toRef } from 'vue';
import { useBooklet } from '../BookletComposable';
import GenericCardVue from './GenericCard.vue';

const props = defineProps<{
    boxId: string
}>();

const { getStepImgSrc, bookletData } = useBooklet(undefined, toRef(props, 'boxId'));

</script>

<template>
    <GenericCardVue :title="bookletData?.name" subtitle="Booklet" :status="!!bookletData ? 'LOADED' : 'ERROR'" :image-src="undefined">
        <template #content><p>Toto</p></template>
    </GenericCardVue>
</template>
