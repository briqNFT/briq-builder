<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import BoxCardVue from './BoxCard.vue';
import type { CARD_MODES }  from '@/builder/BoxData';

const genesisStore = useGenesisStore();

const props = withDefaults(defineProps<{
    boxes: string[],
    mode: CARD_MODES,
}>(), {
    boxes: () => [],
    mode: 'AUTO',
});

</script>

<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 my-8 z-50">
        <component
            v-for="token_id, i in props.boxes" :key="token_id + i"
            :is="genesisStore.metadata[token_id]._status === 'ERROR' ? 'div' : 'router-link'"
            :to="{ name: props.mode === 'INVENTORY' ? 'UserBox' : 'BoxSale', 'params': { 'theme': token_id.split('/')[0], 'box': token_id.split('/')[1] } }">
            <BoxCardVue :mode="mode" :token-name="token_id"/>
        </component>
    </div>
</template>