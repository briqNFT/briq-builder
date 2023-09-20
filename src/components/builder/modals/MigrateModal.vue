<script setup lang="ts">
import { userLegacySetStore } from '@/builder/UserLegacySets';
import { computed } from 'vue';

const emit = defineEmits(['close']);

const props = defineProps<{
    selectedItems: string[],
}>();

const migratable = computed(() => props.selectedItems.filter(x => userLegacySetStore.current?.setData[x].data));
const briqs = computed(() => migratable.value.reduce((acc, x) => acc + (userLegacySetStore.current?.setData[x]?.data?.getNbBriqs?.() || 0), 0));
const notAll = computed(() => migratable.value.length !== props.selectedItems.length);
</script>

<template>
    <Window @close="$emit('close')">
        <template #title>Migrate sets</template>
        <p>We've migrated our Starknet contracts to <span class="font-semibold text-primary"><a href="https://www.dojoengine.org/" target="_blank">Dojo</a></span> !</p>
        <p class="mt-2">
            This requires you to migrate any extra briqs and some NFTs manually.<br>
            Details can be found in the <a class="font-medium text-primary" href="">briqipedia</a> or on <a class="font-medium text-primary" href="https://x.com/briqnft">Twitter</a>.
        </p>
        <p class="my-2">Let us guide you on migrating the following {{ migratable.length > 1 ? `${migratable.length} sets` : 'set' }}:</p>
        <ul class="mt-2 list-disc list-outside ml-6">
            <li class="ml-2 my-2 font-medium" v-for="id in selectedItems" :key="id">{{ userLegacySetStore.current?.setData[id]?.data?.name }}</li>
        </ul>
        <hr class="bg-grad-light h-[2px] border-0 rounded my-4">
        <p>You have two options:</p>
        <ul class="mt-2 mb-4 list-disc list-outside ml-6 leading-tight">
            <li>
                <p>
                    <span class="font-medium text-info-info">'Migrate briqs only'</span> means you will receive <span class="font-medium">{{ briqs }}</span> briqs, and your NFTs will be disassembled.
                    You can then use those briqs to mint new NFTs on the new contracts.
                </p>
                <p class="py-1">Choose this option if you want to <span class="font-medium">create new items or sell your briqs.</span></p>
            </li>
            <li class="my-2">
                <p><span class="font-medium text-info-info">'Migrate briqs & mint sets'</span> means you will directly mint the same NFTs in the new contracts, thus your briq balance won't change.</p>
                <p class="py-1">Choose this option if you wish to <span class="font-medium">keep those NFTs.</span></p>
            </li>
        </ul>
        <p v-if="notAll">WARNING: Some of the selected sets cannot be disassembled.</p>
        <div class="mt-8 mb-2 flex justify-around gap-12 mx-4">
            <Btn class="min-w-[8rem] flex-1" tooltip="Choose this option if you just want the briqs, not the NFTs" @click="emit('close', 0)">Migrate briqs only</Btn>
            <Btn class="min-w-[8rem] flex-1" tooltip="Choose this option if you want to keep your NFTs, not get briqs" @click="emit('close', 1)">Migrate briqs & mint sets</Btn>
        </div>
    </Window>
</template>
