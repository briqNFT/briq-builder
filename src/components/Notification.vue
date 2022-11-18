<script setup lang="ts">
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { useGenesisStore } from '@/builder/GenesisStore';
import { ExplorerTxUrl } from '@/chain/Explorer';
import type { Notification } from '@/Notifications';

defineProps<{
    notif: Notification,
    toast?: boolean
}>();

const icons = {
    'info': 'far fa-clock',
    'warning': 'far fa-circle-exclamation',
    'success': 'far fa-circle-check',
    'error': 'far fa-circle-xmark',
};

const genesisStore = useGenesisStore();
</script>

<style scoped>
p {
    @apply text-sm leading-snug mb-1;
}
</style>

<template>
    <div>
        <h5 v-if="!toast" class="font-medium py-2 flex items-center gap-2">
            <i :style="{ color: `rgb(var(--color-info-${notif.level}))` }" :class="`text-md ${icons[notif.level]}`"/> {{ notif.title }}
        </h5>
        <template v-if="notif.type === 'text'">
            <p>{{ notif.data }}</p>
        </template>
        <template v-else-if="notif.type === 'minting_set'">
            <p>Set '{{ notif.data.name }}' is being minted.</p>
        </template>
        <template v-else-if="notif.type === 'box_purchase_started'">
            <p>The transaction to purchase your box was sent.</p>
            <p>Box: <RouterLink class="text-primary" :to="`/box/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'box_purchase_pending'">
            <p>Your box purchase transaction is pending.<br>You can now start unboxing.</p>
            <p>Box: <RouterLink class="text-primary" :to="`/box/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'box_purchase_confirmed'">
            <p>Your box purchase was confirmed on StarkNet.</p>
            <p>Box: <RouterLink class="text-primary" :to="`/box/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'box_purchase_failure'">
            <p>There was an error with the box purchase transaction.</p>
            <p v-if="toast"><a :href="ExplorerTxUrl(notif.data.tx_hash)" target="_blank" class="text-primary">See details on StarkScan</a></p>
            <p>Box: <RouterLink class="text-primary" :to="`/product/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>

        <template v-else-if="notif.type === 'box_unbox_started'">
            <p>The unboxing transaction was sent.</p>
            <p>Box: <RouterLink class="text-primary" :to="`/box/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'box_unbox_confirmed'">
            <p>Your unboxing was confirmed on StarkNet.</p>
            <p>Box: <RouterLink class="text-primary" :to="`/box/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'box_unbox_failure'">
            <p>There was an error with the unbox transaction.</p>
            <p v-if="toast"><a :href="ExplorerTxUrl(notif.data.tx_hash)" target="_blank" class="text-primary">See details on StarkScan</a></p>
            <p>Box: <RouterLink class="text-primary" :to="`/product/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>

        <template v-else-if="['tentative_bid', 'confirmed_bid', 'pending_bid', 'rejected_bid'].indexOf(notif.type) !== -1">
            <p>Bid: <span class="font-medium">{{ readableNumber(notif.data.amount) }} {{ readableUnit(notif.data.amount) }}</span></p>
            <p>Item: <RouterLink class="text-primary" :to="`/product/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <p v-show="!toast" class="text-xs text-grad-dark mt-2 flex justify-between">
            <span>{{ new Date(notif.timestamp).toLocaleString("en-uk", { dateStyle: "long", timeStyle: "short" }) }}</span>
            <span v-if="notif.data.tx_hash"><a :href="ExplorerTxUrl(notif.data.tx_hash)" target="_blank" class="text-primary">TX</a></span>
        </p>
    </div>
</template>
