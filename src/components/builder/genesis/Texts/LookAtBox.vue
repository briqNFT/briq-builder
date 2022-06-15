<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';

const props = defineProps<{
    active: boolean,
    box_token_id: string,
    startUnbox: CallableFunction,
}>();

const genesisStore = useGenesisStore();

</script>

<template>
    <hr>
    <p>
        <!-- TODO replace with appropriate description here. -->
        {{ genesisStore.metadata[box_token_id]._data?.description }}
    </p>
    <p class="my-2">
        You shake the box in your hands. It rattles slightly.<br>
        The contents on the back side read:<br>
    </p>
    <blockquote>
        <h3>{{ genesisStore.metadata[box_token_id]._data?.name }}</h3>
        <ul>
            <li>One high-quality construction booklet</li>
            <li>{{ genesisStore.metadata[box_token_id]._data?.briqs.length }} briqs required to build it</li>
            <li>One briq booster pack with unknown briqs</li>
        </ul>
    </blockquote>
    <p class="text-center my-4"><Btn @click="props.startUnbox" :disabled="!props.active">Unbox</Btn></p>
</template>